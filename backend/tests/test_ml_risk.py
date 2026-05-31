from app.services.ml_risk import predict_risks
from app.models.analytics import DiseaseEnum, RiskLevelEnum

def test_diabetes_risk_high():
    params = [
        {"parameter_name": "HBA1C", "parameter_value": 7.2, "status": "HIGH"},
        {"parameter_name": "BLOOD_SUGAR", "parameter_value": 140.0, "status": "HIGH"}
    ]
    predictions = predict_risks(params, patient_age=35, patient_gender="MALE")
    
    # Extract diabetes prediction
    diabetes_pred = next(p for p in predictions if p["disease_name"] == DiseaseEnum.DIABETES.value)
    
    assert diabetes_pred["risk_level"] == RiskLevelEnum.HIGH.value
    assert "HbA1c is 7.2%" in diabetes_pred["details"]

def test_anemia_risk_low():
    params = [
        {"parameter_name": "HEMOGLOBIN", "parameter_value": 14.1, "status": "NORMAL"},
        {"parameter_name": "RBC", "parameter_value": 4.5, "status": "NORMAL"}
    ]
    predictions = predict_risks(params, patient_age=28, patient_gender="FEMALE")
    
    anemia_pred = next(p for p in predictions if p["disease_name"] == DiseaseEnum.ANEMIA.value)
    
    assert anemia_pred["risk_level"] == RiskLevelEnum.LOW.value
