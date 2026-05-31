from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from uuid import uuid4
from typing import List
import os
import shutil
import logging

from app.core.database import get_db, SessionLocal
from app.core.config import settings
from app.models.user import User
from app.models.report import Report, ReportParameter, UploadStatusEnum, ParameterEnum, ParameterStatusEnum
from app.models.analytics import HealthScore, RiskPrediction, GradeEnum, DiseaseEnum, RiskLevelEnum
from app.models.audit import Notification, AuditLog, NotificationTypeEnum
from app.schemas.report_schema import ReportResponse, ReportDetailResponse, ParameterResponse
from app.schemas.auth_schema import MessageResponse
from app.api.deps import get_current_user, get_client_ip

logger = logging.getLogger("biolens_reports")

router = APIRouter(prefix="/reports", tags=["Reports"])

ALLOWED_TYPES = {"application/pdf", "image/png", "image/jpeg", "image/jpg"}


def process_report_task(report_id: str, user_id: str):
    """Background task: OCR extraction -> AI parsing -> scoring -> risk predictions."""
    db = SessionLocal()
    try:
        report = db.query(Report).filter(Report.id == report_id).first()
        if not report:
            return

        report.upload_status = UploadStatusEnum.PROCESSING
        db.commit()

        # Get user for demographics
        user = db.query(User).filter(User.id == user_id).first()
        patient_age = 30  # Default
        patient_gender = "MALE"
        if user:
            from datetime import date
            today = date.today()
            patient_age = today.year - user.date_of_birth.year
            patient_gender = user.gender

        # Step 1: OCR text extraction
        import tempfile
        from app.core.supabase_storage import supabase_storage
        
        ext = os.path.splitext(report.file_path)[1] or ".pdf"
        temp_file_path = None
        try:
            file_bytes = supabase_storage.download_file(report.file_path)
            with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as temp_file:
                temp_file.write(file_bytes)
                temp_file_path = temp_file.name
        except Exception as download_error:
            logger.error(f"Failed to download report {report_id} from Supabase: {download_error}")
            # Fallback to local file check
            if os.path.exists(report.file_path):
                temp_file_path = report.file_path
            else:
                raise download_error

        try:
            from app.services.ocr_engine import extract_text
            raw_text = extract_text(temp_file_path)
            report.ocr_raw_text = raw_text
        finally:
            if temp_file_path and temp_file_path != report.file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except Exception as cleanup_error:
                    logger.warning(f"Failed to clean up temp file {temp_file_path}: {cleanup_error}")

        # Step 2: AI-powered parameter parsing via Gemini
        from app.services.gemini_client import parse_report, generate_interpretations, generate_summary
        parsed_params = parse_report(raw_text)

        # Step 3: Save extracted parameters
        saved_params = []
        for param in parsed_params:
            try:
                rp = ReportParameter(
                    id=str(uuid4()),
                    report_id=report_id,
                    parameter_name=param.get("parameter_name", ""),
                    parameter_value=float(param.get("parameter_value", 0)),
                    reference_range_min=float(param.get("reference_range_min", 0)),
                    reference_range_max=float(param.get("reference_range_max", 0)),
                    unit=param.get("unit", ""),
                    status=param.get("status", "NORMAL"),
                )
                db.add(rp)
                saved_params.append(param)
            except Exception as e:
                logger.warning(f"Skipping parameter: {e}")
                continue

        db.flush()

        # Step 4: Generate AI interpretations for abnormal values
        interpretations = generate_interpretations(saved_params, patient_age, patient_gender)
        for rp_obj in db.query(ReportParameter).filter(ReportParameter.report_id == report_id).all():
            key = rp_obj.parameter_name
            if hasattr(key, 'value'):
                key = key.value
            if key in interpretations:
                rp_obj.ai_interpretation = interpretations[key]

        # Step 5: Calculate health score
        from app.services.health_score import calculate_health_score
        score, grade, factors = calculate_health_score(saved_params)
        report.health_score = score

        hs = HealthScore(
            id=str(uuid4()),
            user_id=user_id,
            report_id=report_id,
            score=score,
            grade=grade,
            factors=factors
        )
        db.add(hs)

        # Step 6: Run ML risk predictions
        from app.services.ml_risk import predict_risks
        risks = predict_risks(saved_params, patient_age, patient_gender)
        for risk in risks:
            rp = RiskPrediction(
                id=str(uuid4()),
                user_id=user_id,
                report_id=report_id,
                disease_name=risk["disease_name"],
                risk_level=risk["risk_level"],
                confidence_percentage=risk["confidence_percentage"],
                details=risk.get("details", "")
            )
            db.add(rp)

        # Step 7: Generate AI summary
        risk_dicts = [{"disease_name": r["disease_name"], "risk_level": r["risk_level"],
                       "confidence_percentage": r["confidence_percentage"]} for r in risks]
        summary = generate_summary(saved_params, score, risk_dicts)
        report.ai_summary = summary

        # Step 8: Mark complete and notify
        report.upload_status = UploadStatusEnum.COMPLETED
        report.status_message = "Report analyzed successfully"

        # Check for critical values and create appropriate notifications
        has_critical = any(p.get("status") == "CRITICAL" for p in saved_params)
        if has_critical:
            notif = Notification(
                id=str(uuid4()),
                user_id=user_id,
                title="⚠️ Critical Values Detected",
                message=f"Your report '{report.file_name}' contains critical values that need immediate attention.",
                type=NotificationTypeEnum.CRITICAL_ALERT
            )
            db.add(notif)
        else:
            notif = Notification(
                id=str(uuid4()),
                user_id=user_id,
                title="✅ Report Analyzed",
                message=f"Your report '{report.file_name}' has been successfully analyzed. Health Score: {score}/100.",
                type=NotificationTypeEnum.REPORT_ANALYZED
            )
            db.add(notif)

        db.commit()
        logger.info(f"Report {report_id} processed successfully. Score: {score}")

    except Exception as e:
        logger.error(f"Report processing failed for {report_id}: {str(e)}", exc_info=True)
        db.rollback()
        report = db.query(Report).filter(Report.id == report_id).first()
        if report:
            report.upload_status = UploadStatusEnum.FAILED
            report.status_message = f"Processing failed: {str(e)[:200]}"
            db.commit()
    finally:
        db.close()


@router.post("/upload", status_code=202)
async def upload_report(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a medical report PDF or image for AI analysis."""
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}. Allowed: PDF, PNG, JPEG.")

    # Validate file size
    contents = await file.read()
    if len(contents) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File exceeds maximum size of {settings.MAX_FILE_SIZE_MB}MB")
    await file.seek(0)

    # Save file to Supabase Storage
    from app.core.supabase_storage import supabase_storage
    
    report_id = str(uuid4())
    ext = os.path.splitext(file.filename or "upload")[1] or ".pdf"
    storage_path = f"{report_id}{ext}"
    
    try:
        supabase_storage.upload_file(contents, storage_path, file.content_type)
    except Exception as e:
        logger.error(f"Failed to upload file to Supabase storage: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save file to cloud storage: {str(e)}")

    # Create report record
    report = Report(
        id=report_id,
        user_id=current_user.id,
        file_name=file.filename or "uploaded_report",
        file_path=storage_path,
        file_type=file.content_type or "application/octet-stream",
        file_size=len(contents),
        upload_status=UploadStatusEnum.PENDING
    )
    db.add(report)

    # Audit log
    audit = AuditLog(
        id=str(uuid4()),
        user_id=current_user.id,
        action="REPORT_UPLOAD",
        table_name="reports",
        record_id=report_id,
        ip_address=get_client_ip(request)
    )
    db.add(audit)
    db.commit()

    # Launch async processing
    background_tasks.add_task(process_report_task, report_id, current_user.id)

    return {"report_id": report_id, "status": "PENDING", "message": "Report uploaded and queued for analysis."}


@router.get("/", response_model=List[ReportResponse])
async def list_reports(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all reports for the current user."""
    reports = db.query(Report).filter(
        Report.user_id == current_user.id
    ).order_by(Report.uploaded_at.desc()).all()
    return reports


@router.get("/{report_id}", response_model=ReportDetailResponse)
async def get_report_detail(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed report with extracted parameters."""
    report = db.query(Report).options(
        joinedload(Report.parameters)
    ).filter(Report.id == report_id, Report.user_id == current_user.id).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return ReportDetailResponse(
        id=report.id,
        file_name=report.file_name,
        upload_status=report.upload_status.value if hasattr(report.upload_status, 'value') else report.upload_status,
        health_score=report.health_score,
        ai_summary=report.ai_summary,
        uploaded_at=report.uploaded_at,
        parameters=[
            ParameterResponse(
                parameter_name=p.parameter_name.value if hasattr(p.parameter_name, 'value') else p.parameter_name,
                parameter_value=float(p.parameter_value),
                reference_range_min=float(p.reference_range_min),
                reference_range_max=float(p.reference_range_max),
                unit=p.unit,
                status=p.status.value if hasattr(p.status, 'value') else p.status,
                ai_interpretation=p.ai_interpretation
            )
            for p in report.parameters
        ]
    )


@router.delete("/{report_id}", response_model=MessageResponse)
async def delete_report(
    report_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a report and its associated data."""
    report = db.query(Report).filter(Report.id == report_id, Report.user_id == current_user.id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Remove from Supabase Storage
    from app.core.supabase_storage import supabase_storage
    try:
        supabase_storage.delete_file(report.file_path)
    except Exception as e:
        logger.error(f"Failed to delete file from Supabase storage: {e}")
        # Fallback to local check
        if os.path.exists(report.file_path):
            os.remove(report.file_path)

    # Audit log
    audit = AuditLog(
        id=str(uuid4()),
        user_id=current_user.id,
        action="REPORT_DELETE",
        table_name="reports",
        record_id=report_id,
        ip_address=get_client_ip(request)
    )
    db.add(audit)

    db.delete(report)
    db.commit()

    return MessageResponse(status="success", message="Report deleted successfully")


@router.get("/{report_id}/download-pdf")
async def download_report_pdf(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download AI-generated PDF summary of the report."""
    report = db.query(Report).options(
        joinedload(Report.parameters),
        joinedload(Report.risk_predictions)
    ).filter(Report.id == report_id, Report.user_id == current_user.id).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.upload_status != UploadStatusEnum.COMPLETED:
        raise HTTPException(status_code=400, detail="Report is not yet fully processed")

    from app.services.pdf_generator import generate_report_pdf

    report_data = {
        "patient_name": f"{current_user.first_name} {current_user.last_name}",
        "report_date": str(report.uploaded_at),
        "parameters": [
            {
                "name": p.parameter_name.value if hasattr(p.parameter_name, 'value') else p.parameter_name,
                "value": float(p.parameter_value),
                "unit": p.unit,
                "range": f"{float(p.reference_range_min)} - {float(p.reference_range_max)}",
                "status": p.status.value if hasattr(p.status, 'value') else p.status
            }
            for p in report.parameters
        ],
        "health_score": report.health_score,
        "grade": report.health_score_details.grade.value if report.health_score_details else "N/A",
        "risk_predictions": [
            {
                "disease": r.disease_name.value if hasattr(r.disease_name, 'value') else r.disease_name,
                "level": r.risk_level.value if hasattr(r.risk_level, 'value') else r.risk_level,
                "confidence": float(r.confidence_percentage)
            }
            for r in report.risk_predictions
        ],
        "ai_summary": report.ai_summary or ""
    }

    import io
    pdf_bytes = generate_report_pdf(report_data)
    buffer = io.BytesIO(pdf_bytes)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="BioLens_Report_{report_id[:8]}.pdf"'}
    )
