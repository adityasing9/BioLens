"""
BioLens AI - Database Seeder
Seeds the MySQL database with initial test users (admin and patient) and a history of mock reports and parameters.
"""

import sys
import os
from datetime import date, datetime, timedelta
from uuid import uuid4

# Add the project root to python path to resolve app imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Base, engine
from app.core.security import hash_password
from app.models.user import User, Admin, GenderEnum, AdminRoleEnum
from app.models.report import Report, ReportParameter, UploadStatusEnum, ParameterEnum, ParameterStatusEnum
from app.models.analytics import HealthScore, RiskPrediction, GradeEnum, DiseaseEnum, RiskLevelEnum
from app.models.audit import Notification, NotificationTypeEnum


def seed_db():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if users already exist
        if db.query(User).filter(User.email == "patient@biolens.ai").first():
            print("Database already seeded. Skipping.")
            return

        print("Seeding users...")
        
        # 1. Create Patient User
        patient_id = str(uuid4())
        patient = User(
            id=patient_id,
            email="patient@biolens.ai",
            password_hash=hash_password("Password123!"),
            first_name="Jane",
            last_name="Doe",
            date_of_birth=date(1992, 8, 24),
            gender=GenderEnum.FEMALE,
            phone_number="+15550199",
            is_active=True
        )
        db.add(patient)
        
        # 2. Create Admin User
        admin_user_id = str(uuid4())
        admin_user = User(
            id=admin_user_id,
            email="admin@biolens.ai",
            password_hash=hash_password("AdminSecure123!"),
            first_name="Dr. Alex",
            last_name="Merced",
            date_of_birth=date(1980, 5, 12),
            gender=GenderEnum.MALE,
            phone_number="+15550100",
            is_active=True
        )
        db.add(admin_user)
        db.flush()  # Generate user record to reference in admin profile
        
        admin_profile = Admin(
            id=str(uuid4()),
            user_id=admin_user_id,
            role=AdminRoleEnum.SUPERADMIN
        )
        db.add(admin_profile)
        
        # 3. Create historical reports for Patient (Jane Doe) to show trends
        print("Seeding reports and parameters...")
        
        # Report 1 (1 year ago) - Poor health state
        r1_id = str(uuid4())
        r1_date = datetime.utcnow() - timedelta(days=365)
        report1 = Report(
            id=r1_id,
            user_id=patient_id,
            file_name="blood_test_june_2025.pdf",
            file_path="uploads/mock_report_1.pdf",
            file_type="application/pdf",
            file_size=125432,
            upload_status=UploadStatusEnum.COMPLETED,
            ocr_raw_text="Jane Doe Lab Results - June 2025. Hemoglobin low: 9.8 g/dL, Cholesterol: 255 mg/dL.",
            ai_summary="Your historical report from June 2025 indicated moderate iron deficiency anemia and high cardiovascular lipid levels. Key concerns were Hemoglobin and LDL Cholesterol.",
            health_score=48,
            uploaded_at=r1_date
        )
        db.add(report1)
        
        # Report 2 (6 months ago) - Improved health state
        r2_id = str(uuid4())
        r2_date = datetime.utcnow() - timedelta(days=180)
        report2 = Report(
            id=r2_id,
            user_id=patient_id,
            file_name="blood_test_dec_2025.pdf",
            file_path="uploads/mock_report_2.pdf",
            file_type="application/pdf",
            file_size=130455,
            upload_status=UploadStatusEnum.COMPLETED,
            ocr_raw_text="Jane Doe Lab Results - December 2025. Hemoglobin: 11.5 g/dL, Cholesterol: 215 mg/dL.",
            ai_summary="This report showed positive trends. Your hemoglobin level rose significantly, moving closer to the reference range. Cholesterol also improved due to dietary modifications.",
            health_score=72,
            uploaded_at=r2_date
        )
        db.add(report2)
        
        # Report 3 (Latest - 2 days ago) - Excellent health state
        r3_id = str(uuid4())
        r3_date = datetime.utcnow() - timedelta(days=2)
        report3 = Report(
            id=r3_id,
            user_id=patient_id,
            file_name="blood_test_latest_may2026.pdf",
            file_path="uploads/mock_report_latest.pdf",
            file_type="application/pdf",
            file_size=128500,
            upload_status=UploadStatusEnum.COMPLETED,
            ocr_raw_text="Jane Doe Lab Results - May 2026. Hemoglobin: 12.8 g/dL, WBC: 6.2 k/uL, RBC: 4.3 M/uL, Platelets: 250 k/uL, HbA1c: 5.4%, Blood Sugar: 90 mg/dL, TSH: 2.1 mIU/L, LDL: 110 mg/dL, HDL: 55 mg/dL.",
            ai_summary="Your latest health assessment represents outstanding progress. All primary markers, including Hemoglobin, White Blood Cells, HbA1c, and lipid panels, reside securely in their respective normal reference intervals.",
            health_score=91,
            uploaded_at=r3_date
        )
        db.add(report3)
        db.flush()
        
        # Helper lists of parameters for reports
        # Format: (name, value, min, max, unit, status, interpretation)
        r1_params = [
            (ParameterEnum.HEMOGLOBIN, 9.8, 12.0, 16.0, "g/dL", ParameterStatusEnum.LOW, "Your hemoglobin is low, suggesting mild iron-deficiency anemia."),
            (ParameterEnum.RBC, 3.6, 4.0, 5.2, "M/uL", ParameterStatusEnum.LOW, "Low red blood cells match the low hemoglobin profile."),
            (ParameterEnum.WBC, 10.5, 4.5, 11.0, "k/uL", ParameterStatusEnum.NORMAL, "White blood cell count is normal."),
            (ParameterEnum.PLATELETS, 240.0, 150.0, 450.0, "k/uL", ParameterStatusEnum.NORMAL, "Platelet count is healthy."),
            (ParameterEnum.HBA1C, 5.8, 4.0, 5.6, "%", ParameterStatusEnum.HIGH, "Slightly elevated HbA1c suggests a pre-diabetic state. Action is recommended."),
            (ParameterEnum.BLOOD_SUGAR, 105.0, 70.0, 100.0, "mg/dL", ParameterStatusEnum.HIGH, "Mild fasting hyperglycemia corresponds to your HbA1c profile."),
            (ParameterEnum.LDL, 165.0, 0.0, 100.0, "mg/dL", ParameterStatusEnum.HIGH, "Your LDL (bad) cholesterol is high, indicating increased cardiovascular risk."),
            (ParameterEnum.HDL, 38.0, 40.0, 60.0, "mg/dL", ParameterStatusEnum.LOW, "Low HDL (good) cholesterol limits active cardiovascular protection."),
            (ParameterEnum.TRIGLYCERIDES, 185.0, 0.0, 150.0, "mg/dL", ParameterStatusEnum.HIGH, "Elevated triglycerides, often driven by diet and activity levels.")
        ]
        
        r2_params = [
            (ParameterEnum.HEMOGLOBIN, 11.5, 12.0, 16.0, "g/dL", ParameterStatusEnum.LOW, "Hemoglobin has improved significantly, though still slightly low."),
            (ParameterEnum.RBC, 3.9, 4.0, 5.2, "M/uL", ParameterStatusEnum.LOW, "Red blood cells are approaching the normal threshold."),
            (ParameterEnum.WBC, 7.8, 4.5, 11.0, "k/uL", ParameterStatusEnum.NORMAL, "White blood cells are in excellent range."),
            (ParameterEnum.PLATELETS, 260.0, 150.0, 450.0, "k/uL", ParameterStatusEnum.NORMAL, "Platelet count remains normal."),
            (ParameterEnum.HBA1C, 5.5, 4.0, 5.6, "%", ParameterStatusEnum.NORMAL, "HbA1c has returned to normal bounds, representing great glucose control."),
            (ParameterEnum.BLOOD_SUGAR, 94.0, 70.0, 100.0, "mg/dL", ParameterStatusEnum.NORMAL, "Fasting blood sugar is now normal."),
            (ParameterEnum.LDL, 132.0, 0.0, 100.0, "mg/dL", ParameterStatusEnum.HIGH, "LDL cholesterol is moderately elevated but improving."),
            (ParameterEnum.HDL, 45.0, 40.0, 60.0, "mg/dL", ParameterStatusEnum.NORMAL, "HDL has entered healthy parameters."),
            (ParameterEnum.TRIGLYCERIDES, 142.0, 0.0, 150.0, "mg/dL", ParameterStatusEnum.NORMAL, "Triglycerides have successfully normalized.")
        ]
        
        r3_params = [
            (ParameterEnum.HEMOGLOBIN, 12.8, 12.0, 16.0, "g/dL", ParameterStatusEnum.NORMAL, "Your hemoglobin is now healthy, indicating full recovery of oxygen capacity."),
            (ParameterEnum.RBC, 4.3, 4.0, 5.2, "M/uL", ParameterStatusEnum.NORMAL, "Red blood cell count resides in standard healthy range."),
            (ParameterEnum.WBC, 6.2, 4.5, 11.0, "k/uL", ParameterStatusEnum.NORMAL, "Healthy immune system status represented by normal WBCs."),
            (ParameterEnum.PLATELETS, 250.0, 150.0, 450.0, "k/uL", ParameterStatusEnum.NORMAL, "Normal platelet count supports standard clotting functionality."),
            (ParameterEnum.HBA1C, 5.4, 4.0, 5.6, "%", ParameterStatusEnum.NORMAL, "Excellent long-term glycemic control represented by your HbA1c."),
            (ParameterEnum.BLOOD_SUGAR, 90.0, 70.0, 100.0, "mg/dL", ParameterStatusEnum.NORMAL, "Optimal fasting blood sugar level."),
            (ParameterEnum.TSH, 2.1, 0.4, 4.0, "mIU/L", ParameterStatusEnum.NORMAL, "Thyroid stimulating hormone is balanced."),
            (ParameterEnum.LDL, 110.0, 0.0, 100.0, "mg/dL", ParameterStatusEnum.HIGH, "LDL remains slightly elevated but represents huge progress from last year."),
            (ParameterEnum.HDL, 55.0, 40.0, 60.0, "mg/dL", ParameterStatusEnum.NORMAL, "Optimal active HDL protective level."),
            (ParameterEnum.TRIGLYCERIDES, 115.0, 0.0, 150.0, "mg/dL", ParameterStatusEnum.NORMAL, "Triglycerides are well managed and healthy."),
            (ParameterEnum.CHOLESTEROL, 188.0, 100.0, 200.0, "mg/dL", ParameterStatusEnum.NORMAL, "Total cholesterol is fully in check.")
        ]
        
        # Add parameters to DB
        for report_id, params in [(r1_id, r1_params), (r2_id, r2_params), (r3_id, r3_params)]:
            for name, val, min_val, max_val, unit, status, interp in params:
                rp = ReportParameter(
                    id=str(uuid4()),
                    report_id=report_id,
                    parameter_name=name,
                    parameter_value=val,
                    reference_range_min=min_val,
                    reference_range_max=max_val,
                    unit=unit,
                    status=status,
                    ai_interpretation=interp
                )
                db.add(rp)
                
        # 4. Create Health Scores records
        db.add(HealthScore(
            id=str(uuid4()),
            user_id=patient_id,
            report_id=r1_id,
            score=48,
            grade=GradeEnum.POOR,
            factors={"HEMOGLOBIN": 30, "HBA1C": 50, "LDL": 25, "HDL": 40}
        ))
        db.add(HealthScore(
            id=str(uuid4()),
            user_id=patient_id,
            report_id=r2_id,
            score=72,
            grade=GradeEnum.GOOD,
            factors={"HEMOGLOBIN": 75, "HBA1C": 90, "LDL": 60, "HDL": 80}
        ))
        db.add(HealthScore(
            id=str(uuid4()),
            user_id=patient_id,
            report_id=r3_id,
            score=91,
            grade=GradeEnum.EXCELLENT,
            factors={"HEMOGLOBIN": 100, "HBA1C": 100, "LDL": 85, "HDL": 95}
        ))
        
        # 5. Create Risk Predictions
        # Report 1 risks
        db.add(RiskPrediction(
            id=str(uuid4()),
            user_id=patient_id,
            report_id=r1_id,
            disease_name=DiseaseEnum.ANEMIA,
            risk_level=RiskLevelEnum.HIGH,
            confidence_percentage=82.5,
            details="High probability of iron-deficiency anemia due to a critically low Hemoglobin of 9.8 g/dL and low Red Blood Cell count."
        ))
        db.add(RiskPrediction(
            id=str(uuid4()),
            user_id=patient_id,
            report_id=r1_id,
            disease_name=DiseaseEnum.DIABETES,
            risk_level=RiskLevelEnum.MEDIUM,
            confidence_percentage=65.0,
            details="Borderline elevated HbA1c (5.8%) and Blood Sugar (105 mg/dL) place you in a pre-diabetic risk bracket."
        ))
        db.add(RiskPrediction(
            id=str(uuid4()),
            user_id=patient_id,
            report_id=r1_id,
            disease_name=DiseaseEnum.HEART_DISEASE,
            risk_level=RiskLevelEnum.HIGH,
            confidence_percentage=78.0,
            details="High LDL Cholesterol (165 mg/dL), low protective HDL (38 mg/dL), and high triglycerides mark elevated risk parameters."
        ))
        
        # Report 3 (Latest) risks (all low now!)
        db.add(RiskPrediction(
            id=str(uuid4()),
            user_id=patient_id,
            report_id=r3_id,
            disease_name=DiseaseEnum.ANEMIA,
            risk_level=RiskLevelEnum.LOW,
            confidence_percentage=94.5,
            details="Hemoglobin has fully normalized to 12.8 g/dL, resolving previous high anemia risks."
        ))
        db.add(RiskPrediction(
            id=str(uuid4()),
            user_id=patient_id,
            report_id=r3_id,
            disease_name=DiseaseEnum.DIABETES,
            risk_level=RiskLevelEnum.LOW,
            confidence_percentage=98.0,
            details="HbA1c (5.4%) and fasting glucose are entirely in safe ranges."
        ))
        db.add(RiskPrediction(
            id=str(uuid4()),
            user_id=patient_id,
            report_id=r3_id,
            disease_name=DiseaseEnum.HEART_DISEASE,
            risk_level=RiskLevelEnum.LOW,
            confidence_percentage=89.0,
            details="Lipid panels have drastically improved, lowering cardiovascular risk markers down to standard guidelines."
        ))
        
        # 6. Create some notification logs
        db.add(Notification(
            id=str(uuid4()),
            user_id=patient_id,
            title="Medical Report Processed",
            message="Your latest medical report 'blood_test_latest_may2026.pdf' has been parsed successfully! Your overall Health Score is an Excellent 91/100.",
            type=NotificationTypeEnum.REPORT_ANALYZED,
            is_read=False
        ))
        db.add(Notification(
            id=str(uuid4()),
            user_id=patient_id,
            title="Significant Health Improvement",
            message="Congratulations! Your health score has surged by +19 points, rising from a Good 72 to an Excellent 91.",
            type=NotificationTypeEnum.HEALTH_CHANGE,
            is_read=False
        ))
        
        db.commit()
        print("Database seeded successfully with initial mock records!")
        print("Users available:")
        print("  - Patient: patient@biolens.ai  / Password123!")
        print("  - Admin:   admin@biolens.ai    / AdminSecure123!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_db()
