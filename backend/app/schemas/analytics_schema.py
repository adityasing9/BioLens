from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict


class HealthScoreResponse(BaseModel):
    id: str
    score: int
    grade: str
    factors: Optional[Dict] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RiskPredictionResponse(BaseModel):
    disease_name: str
    risk_level: str
    confidence_percentage: float
    details: Optional[str] = None

    class Config:
        from_attributes = True


class AdminDashboardResponse(BaseModel):
    total_users: int
    total_reports_processed: int
    ocr_average_accuracy_percent: float
    ai_api_calls_total: int
    system_errors_last_24h: int


class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    action: str
    table_name: str
    record_id: Optional[str] = None
    ip_address: str
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
