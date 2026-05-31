from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta
from typing import List

from app.core.database import get_db
from app.models.user import User
from app.models.report import Report, ReportParameter
from app.models.analytics import HealthScore
from app.schemas.report_schema import TrendResponse, TrendPoint, ReportComparisonResponse
from app.schemas.analytics_schema import HealthScoreResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/trends", response_model=TrendResponse)
async def get_trends(
    parameter_name: str = Query(..., description="Parameter to track, e.g. HEMOGLOBIN"),
    range: str = Query("YEARLY", description="WEEKLY, MONTHLY, or YEARLY"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get historical trend data for a specific medical parameter."""
    # Determine date cutoff
    now = datetime.utcnow()
    if range == "WEEKLY":
        cutoff = now - timedelta(weeks=1)
    elif range == "MONTHLY":
        cutoff = now - timedelta(days=30)
    else:
        cutoff = now - timedelta(days=365)

    # Query parameters joined with reports for date filtering
    results = db.query(ReportParameter, Report).join(
        Report, ReportParameter.report_id == Report.id
    ).filter(
        Report.user_id == current_user.id,
        ReportParameter.parameter_name == parameter_name,
        Report.uploaded_at >= cutoff
    ).order_by(Report.uploaded_at.asc()).all()

    # Determine unit from first result
    unit = ""
    trend_points = []
    for param, report in results:
        unit = param.unit
        trend_points.append(TrendPoint(
            date=report.uploaded_at.strftime("%Y-%m-%d"),
            value=float(param.parameter_value),
            status=param.status.value if hasattr(param.status, 'value') else param.status
        ))

    return TrendResponse(parameter=parameter_name, unit=unit, trend_points=trend_points)


@router.get("/comparison", response_model=ReportComparisonResponse)
async def compare_reports(
    base_report_id: str = Query(..., description="Older report ID"),
    compare_report_id: str = Query(..., description="Newer report ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compare two reports side by side and identify changes."""
    # Fetch parameters for both reports
    base_params = db.query(ReportParameter).join(Report).filter(
        Report.id == base_report_id, Report.user_id == current_user.id
    ).all()
    compare_params = db.query(ReportParameter).join(Report).filter(
        Report.id == compare_report_id, Report.user_id == current_user.id
    ).all()

    if not base_params or not compare_params:
        raise HTTPException(status_code=404, detail="One or both reports not found")

    # Build lookup maps
    base_map = {
        (p.parameter_name.value if hasattr(p.parameter_name, 'value') else p.parameter_name): p
        for p in base_params
    }
    compare_map = {
        (p.parameter_name.value if hasattr(p.parameter_name, 'value') else p.parameter_name): p
        for p in compare_params
    }

    improvements = []
    deteriorations = []
    stable = []

    for name in set(list(base_map.keys()) + list(compare_map.keys())):
        if name in base_map and name in compare_map:
            old_val = float(base_map[name].parameter_value)
            new_val = float(compare_map[name].parameter_value)
            old_status = base_map[name].status.value if hasattr(base_map[name].status, 'value') else base_map[name].status
            new_status = compare_map[name].status.value if hasattr(compare_map[name].status, 'value') else compare_map[name].status
            unit = compare_map[name].unit

            if old_status != "NORMAL" and new_status == "NORMAL":
                improvements.append(f"{name} normalized from {old_val} to {new_val} {unit}")
            elif old_status == "NORMAL" and new_status != "NORMAL":
                deteriorations.append(f"{name} changed from {old_val} to {new_val} {unit} ({new_status})")
            elif abs(new_val - old_val) / max(old_val, 0.01) > 0.1:
                if new_status in ("HIGH", "CRITICAL"):
                    deteriorations.append(f"{name} increased from {old_val} to {new_val} {unit}")
                elif new_status in ("LOW",):
                    deteriorations.append(f"{name} decreased from {old_val} to {new_val} {unit}")
                else:
                    stable.append(f"{name} changed slightly from {old_val} to {new_val} {unit}")
            else:
                stable.append(f"{name} remained stable at {new_val} {unit}")

    return ReportComparisonResponse(improvements=improvements, deteriorations=deteriorations, stable=stable)


@router.get("/health-score", response_model=HealthScoreResponse)
async def get_latest_health_score(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the latest health score for the current user."""
    score = db.query(HealthScore).filter(
        HealthScore.user_id == current_user.id
    ).order_by(HealthScore.created_at.desc()).first()

    if not score:
        raise HTTPException(status_code=404, detail="No health score available. Upload a report first.")

    return HealthScoreResponse(
        id=score.id,
        score=score.score,
        grade=score.grade.value if hasattr(score.grade, 'value') else score.grade,
        factors=score.factors,
        created_at=score.created_at
    )
