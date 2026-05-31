import enum
from sqlalchemy import Column, String, Integer, Enum, TEXT, DECIMAL, TIMESTAMP, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class UploadStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class ParameterEnum(str, enum.Enum):
    HEMOGLOBIN = "HEMOGLOBIN"
    RBC = "RBC"
    WBC = "WBC"
    PLATELETS = "PLATELETS"
    HBA1C = "HBA1C"
    BLOOD_SUGAR = "BLOOD_SUGAR"
    TSH = "TSH"
    T3 = "T3"
    T4 = "T4"
    HDL = "HDL"
    LDL = "LDL"
    TRIGLYCERIDES = "TRIGLYCERIDES"
    CHOLESTEROL = "CHOLESTEROL"
    CREATININE = "CREATININE"
    URIC_ACID = "URIC_ACID"
    SGOT = "SGOT"
    SGPT = "SGPT"

class ParameterStatusEnum(str, enum.Enum):
    NORMAL = "NORMAL"
    LOW = "LOW"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    upload_status = Column(Enum(UploadStatusEnum), default=UploadStatusEnum.PENDING, nullable=False, index=True)
    ocr_raw_text = Column(LONGTEXT, nullable=True)
    ai_summary = Column(TEXT, nullable=True)
    health_score = Column(Integer, nullable=True)
    status_message = Column(String(255), nullable=True)
    uploaded_at = Column(TIMESTAMP, server_default=func.current_timestamp(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="reports")
    parameters = relationship("ReportParameter", back_populates="report", cascade="all, delete-orphan")
    health_score_details = relationship("HealthScore", uselist=False, back_populates="report", cascade="all, delete-orphan")
    risk_predictions = relationship("RiskPrediction", back_populates="report", cascade="all, delete-orphan")

class ReportParameter(Base):
    __tablename__ = "report_parameters"

    id = Column(String(36), primary_key=True)
    report_id = Column(String(36), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False)
    parameter_name = Column(Enum(ParameterEnum), nullable=False, index=True)
    parameter_value = Column(DECIMAL(10, 3), nullable=False)
    reference_range_min = Column(DECIMAL(10, 3), nullable=False)
    reference_range_max = Column(DECIMAL(10, 3), nullable=False)
    unit = Column(String(20), nullable=False)
    status = Column(Enum(ParameterStatusEnum), nullable=False, index=True)
    ai_interpretation = Column(TEXT, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp(), nullable=False)

    # Relationships
    report = relationship("Report", back_populates="parameters")

    __table_args__ = (
        UniqueConstraint('report_id', 'parameter_name', name='uq_report_parameter'),
    )
