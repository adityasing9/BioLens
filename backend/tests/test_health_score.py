from app.services.health_score import calculate_health_score
from app.models.report import ParameterEnum

def test_excellent_health_score():
    # Setup normal healthy parameters
    params = [
        {"parameter_name": ParameterEnum.HEMOGLOBIN.value, "parameter_value": 14.5, "reference_range_min": 12.0, "reference_range_max": 16.0, "unit": "g/dL", "status": "NORMAL"},
        {"parameter_name": ParameterEnum.BLOOD_SUGAR.value, "parameter_value": 85.0, "reference_range_min": 70.0, "reference_range_max": 100.0, "unit": "mg/dL", "status": "NORMAL"},
        {"parameter_name": ParameterEnum.HBA1C.value, "parameter_value": 5.2, "reference_range_min": 4.0, "reference_range_max": 5.6, "unit": "%", "status": "NORMAL"}
    ]
    
    score, grade, factors = calculate_health_score(params)
    
    assert score >= 85
    assert grade == "EXCELLENT"
    assert factors[ParameterEnum.HEMOGLOBIN.value] == 95

def test_poor_health_score():
    # Setup abnormal parameters
    params = [
        {"parameter_name": ParameterEnum.HEMOGLOBIN.value, "parameter_value": 8.5, "reference_range_min": 12.0, "reference_range_max": 16.0, "unit": "g/dL", "status": "CRITICAL"},
        {"parameter_name": ParameterEnum.BLOOD_SUGAR.value, "parameter_value": 180.0, "reference_range_min": 70.0, "reference_range_max": 100.0, "unit": "mg/dL", "status": "HIGH"},
        {"parameter_name": ParameterEnum.HBA1C.value, "parameter_value": 8.1, "reference_range_min": 4.0, "reference_range_max": 5.6, "unit": "%", "status": "CRITICAL"}
    ]
    
    score, grade, factors = calculate_health_score(params)
    
    assert score < 50
    assert grade == "POOR"
