from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class ParameterResponse(BaseModel):
    parameter_name: str
    parameter_value: float
    reference_range_min: float
    reference_range_max: float
    unit: str
    status: str
    ai_interpretation: Optional[str] = None

    class Config:
        from_attributes = True


class ReportResponse(BaseModel):
    id: str
    file_name: str
    upload_status: str
    health_score: Optional[int] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True


class ReportDetailResponse(BaseModel):
    id: str
    file_name: str
    upload_status: str
    health_score: Optional[int] = None
    ai_summary: Optional[str] = None
    uploaded_at: datetime
    parameters: List[ParameterResponse] = []

    class Config:
        from_attributes = True


class ReportComparisonResponse(BaseModel):
    improvements: List[str] = []
    deteriorations: List[str] = []
    stable: List[str] = []


class TrendPoint(BaseModel):
    date: str
    value: float
    status: str


class TrendResponse(BaseModel):
    parameter: str
    unit: str
    trend_points: List[TrendPoint] = []
