from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.user import User
from app.models.report import Report
from app.models.analytics import RiskPrediction
from app.schemas.analytics_schema import RiskPredictionResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/risks", tags=["Risk Predictions"])


@router.get("/{report_id}", response_model=List[RiskPredictionResponse])
async def get_risk_predictions(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get ML risk predictions for a specific report."""
    # Verify report ownership
    report = db.query(Report).filter(
        Report.id == report_id, Report.user_id == current_user.id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    predictions = db.query(RiskPrediction).filter(
        RiskPrediction.report_id == report_id
    ).all()

    return [
        RiskPredictionResponse(
            disease_name=p.disease_name.value if hasattr(p.disease_name, 'value') else p.disease_name,
            risk_level=p.risk_level.value if hasattr(p.risk_level, 'value') else p.risk_level,
            confidence_percentage=float(p.confidence_percentage),
            details=p.details
        )
        for p in predictions
    ]
