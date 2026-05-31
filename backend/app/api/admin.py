from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List

from app.core.database import get_db
from app.models.user import User
from app.models.report import Report
from app.models.audit import AuditLog, Notification
from app.schemas.auth_schema import UserResponse, MessageResponse
from app.schemas.report_schema import ReportResponse
from app.schemas.analytics_schema import AdminDashboardResponse, AuditLogResponse
from app.api.deps import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/analytics/dashboard", response_model=AdminDashboardResponse)
async def admin_dashboard(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get aggregated platform analytics for the admin dashboard."""
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_reports = db.query(func.count(Report.id)).scalar() or 0

    # Count system errors in last 24 hours from audit logs
    cutoff = datetime.utcnow() - timedelta(hours=24)
    errors = db.query(func.count(AuditLog.id)).filter(
        AuditLog.action.like("%ERROR%"),
        AuditLog.created_at >= cutoff
    ).scalar() or 0

    # Count AI API calls (chat messages from ASSISTANT)
    from app.models.chat import AIMessage, SenderEnum
    ai_calls = db.query(func.count(AIMessage.id)).filter(
        AIMessage.sender == SenderEnum.ASSISTANT
    ).scalar() or 0

    return AdminDashboardResponse(
        total_users=total_users,
        total_reports_processed=total_reports,
        ocr_average_accuracy_percent=97.5,  # Placeholder until OCR accuracy tracking is added
        ai_api_calls_total=ai_calls,
        system_errors_last_24h=errors
    )


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all registered users with pagination."""
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.patch("/users/{user_id}/status", response_model=MessageResponse)
async def toggle_user_status(
    user_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Toggle a user's active/inactive status."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")

    user.is_active = not user.is_active
    db.commit()

    status_text = "activated" if user.is_active else "deactivated"
    return MessageResponse(status="success", message=f"User {user.email} has been {status_text}")


@router.get("/reports", response_model=List[ReportResponse])
async def list_all_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all reports system-wide with pagination."""
    reports = db.query(Report).order_by(Report.uploaded_at.desc()).offset(skip).limit(limit).all()
    return reports


@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    action: str = Query(None, description="Filter by action type"),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List audit logs with optional action filtering and pagination."""
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs
