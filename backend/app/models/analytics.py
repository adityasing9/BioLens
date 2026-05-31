import enum
from sqlalchemy import Column, String, Integer, Enum, TEXT, DECIMAL, TIMESTAMP, ForeignKey, UniqueConstraint, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class GradeEnum(str, enum.Enum):
    GOOD = "GOOD"
    MODERATE = "MODERATE"
    POOR = "POOR"
    EXCELLENT = "EXCELLENT"

class DiseaseEnum(str, enum.Enum):
    DIABETES = "DIABETES"
    ANEMIA = "ANEMIA"
    THYROID_DISORDERS = "THYROID_DISORDERS"
    LIVER_DISEASE = "LIVER_DISEASE"
    KIDNEY_DISEASE = "KIDNEY_DISEASE"
    HEART_DISEASE = "HEART_DISEASE"

class RiskLevelEnum(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class HealthScore(Base):
    __tablename__ = "health_scores"

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    report_id = Column(String(36), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, unique=True)
    score = Column(Integer, nullable=False)
    grade = Column(Enum(GradeEnum), nullable=False)
    factors = Column(JSON, nullable=True) # Factor-weight mappings
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="health_scores")
    report = relationship("Report", back_populates="health_score_details")

class RiskPrediction(Base):
    __tablename__ = "risk_predictions"

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    report_id = Column(String(36), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False)
    disease_name = Column(Enum(DiseaseEnum), nullable=False, index=True)
    risk_level = Column(Enum(RiskLevelEnum), nullable=False)
    confidence_percentage = Column(DECIMAL(5, 2), nullable=False)
    details = Column(TEXT, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="risk_predictions")
    report = relationship("Report", back_populates="risk_predictions")

    __table_args__ = (
        UniqueConstraint('report_id', 'disease_name', name='uq_report_disease'),
    )
