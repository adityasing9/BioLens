"""
BioLens AI - ML Risk Prediction Service
==========================================
Rule-based disease risk prediction engine that mimics ML model output.
This module will be replaced with trained scikit-learn models in a future
release; the function signatures and return types will remain stable.
"""

import logging
from typing import Dict, List, Optional

from app.models.analytics import DiseaseEnum, RiskLevelEnum

logger = logging.getLogger('biolens_ml')


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_param(parameters: list[dict], name: str) -> Optional[dict]:
    """Find a parameter dict by name (case-insensitive)."""
    for p in parameters:
        if p.get("parameter_name", "").upper() == name.upper():
            return p
    return None


def _get_value(parameters: list[dict], name: str) -> Optional[float]:
    """Extract a numeric value for a parameter, or None if absent."""
    param = _get_param(parameters, name)
    if param is not None:
        try:
            return float(param["parameter_value"])
        except (KeyError, ValueError, TypeError):
            return None
    return None


def _get_status(parameters: list[dict], name: str) -> Optional[str]:
    """Extract the status string for a parameter, or None if absent."""
    param = _get_param(parameters, name)
    if param is not None:
        return param.get("status", "").upper()
    return None


def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


# ---------------------------------------------------------------------------
# Disease-specific risk assessors
# ---------------------------------------------------------------------------
def _assess_diabetes(params: list[dict], age: int, gender: str) -> dict:
    """Assess Type-2 Diabetes risk from HBA1C and blood sugar."""
    hba1c = _get_value(params, "HBA1C")
    sugar = _get_value(params, "BLOOD_SUGAR")
    details_parts: list[str] = []
    risk_score = 0.0  # accumulator 0-100

    if hba1c is not None:
        if hba1c >= 6.5:
            risk_score += 50
            details_parts.append(f"HbA1c is {hba1c}% (≥6.5% is diabetic range)")
        elif hba1c >= 5.7:
            risk_score += 30
            details_parts.append(f"HbA1c is {hba1c}% (5.7–6.4% is pre-diabetic range)")
        else:
            details_parts.append(f"HbA1c is {hba1c}% (normal)")

    if sugar is not None:
        if sugar >= 126:
            risk_score += 40
            details_parts.append(f"Fasting blood sugar is {sugar} mg/dL (≥126 is diabetic)")
        elif sugar >= 100:
            risk_score += 20
            details_parts.append(f"Fasting blood sugar is {sugar} mg/dL (100–125 is pre-diabetic)")
        else:
            details_parts.append(f"Fasting blood sugar is {sugar} mg/dL (normal)")

    # Age adjustment
    if age > 45:
        risk_score += 5
        details_parts.append("Age >45 adds minor risk factor")

    risk_score = _clamp(risk_score)

    if risk_score >= 60:
        level = RiskLevelEnum.HIGH
    elif risk_score >= 25:
        level = RiskLevelEnum.MEDIUM
    else:
        level = RiskLevelEnum.LOW

    return {
        "disease_name": DiseaseEnum.DIABETES.value,
        "risk_level": level.value,
        "confidence_percentage": round(risk_score, 2),
        "details": "; ".join(details_parts) if details_parts else "Insufficient data for assessment.",
    }


def _assess_anemia(params: list[dict], age: int, gender: str) -> dict:
    """Assess Anemia risk from haemoglobin and RBC count."""
    hb = _get_value(params, "HEMOGLOBIN")
    rbc = _get_value(params, "RBC")
    details_parts: list[str] = []
    risk_score = 0.0

    if hb is not None:
        # Gender-specific thresholds
        if gender.lower() == "female":
            if hb < 10:
                risk_score += 55
                details_parts.append(f"Haemoglobin {hb} g/dL is significantly low for females (<10)")
            elif hb < 12:
                risk_score += 30
                details_parts.append(f"Haemoglobin {hb} g/dL is mildly low for females (normal ≥12)")
            else:
                details_parts.append(f"Haemoglobin {hb} g/dL is normal for females")
        else:
            if hb < 10:
                risk_score += 55
                details_parts.append(f"Haemoglobin {hb} g/dL is significantly low (<10)")
            elif hb < 13:
                risk_score += 30
                details_parts.append(f"Haemoglobin {hb} g/dL is mildly low for males (normal ≥13)")
            else:
                details_parts.append(f"Haemoglobin {hb} g/dL is normal for males")

    if rbc is not None:
        rbc_status = _get_status(params, "RBC")
        if rbc_status in ("LOW", "CRITICAL"):
            risk_score += 20
            details_parts.append(f"RBC count {rbc} is below normal range")
        else:
            details_parts.append(f"RBC count {rbc} is within normal range")

    risk_score = _clamp(risk_score)

    if risk_score >= 50:
        level = RiskLevelEnum.HIGH
    elif risk_score >= 25:
        level = RiskLevelEnum.MEDIUM
    else:
        level = RiskLevelEnum.LOW

    return {
        "disease_name": DiseaseEnum.ANEMIA.value,
        "risk_level": level.value,
        "confidence_percentage": round(risk_score, 2),
        "details": "; ".join(details_parts) if details_parts else "Insufficient data for assessment.",
    }


def _assess_thyroid(params: list[dict], age: int, gender: str) -> dict:
    """Assess Thyroid Disorder risk from TSH, T3, and T4."""
    tsh = _get_value(params, "TSH")
    t3 = _get_value(params, "T3")
    t4 = _get_value(params, "T4")
    details_parts: list[str] = []
    risk_score = 0.0

    if tsh is not None:
        if tsh < 0.4:
            risk_score += 45
            details_parts.append(f"TSH {tsh} mIU/L is low (<0.4, may suggest hyperthyroidism)")
        elif tsh > 4.0:
            risk_score += 45
            details_parts.append(f"TSH {tsh} mIU/L is elevated (>4.0, may suggest hypothyroidism)")
        elif tsh > 3.5:
            risk_score += 15
            details_parts.append(f"TSH {tsh} mIU/L is borderline high")
        elif tsh < 0.5:
            risk_score += 15
            details_parts.append(f"TSH {tsh} mIU/L is borderline low")
        else:
            details_parts.append(f"TSH {tsh} mIU/L is normal")

    if t3 is not None:
        t3_status = _get_status(params, "T3")
        if t3_status in ("LOW", "HIGH", "CRITICAL"):
            risk_score += 15
            details_parts.append(f"T3 is {t3_status.lower()} ({t3})")
        else:
            details_parts.append(f"T3 {t3} is within normal range")

    if t4 is not None:
        t4_status = _get_status(params, "T4")
        if t4_status in ("LOW", "HIGH", "CRITICAL"):
            risk_score += 15
            details_parts.append(f"T4 is {t4_status.lower()} ({t4})")
        else:
            details_parts.append(f"T4 {t4} is within normal range")

    risk_score = _clamp(risk_score)

    if risk_score >= 50:
        level = RiskLevelEnum.HIGH
    elif risk_score >= 20:
        level = RiskLevelEnum.MEDIUM
    else:
        level = RiskLevelEnum.LOW

    return {
        "disease_name": DiseaseEnum.THYROID_DISORDERS.value,
        "risk_level": level.value,
        "confidence_percentage": round(risk_score, 2),
        "details": "; ".join(details_parts) if details_parts else "Insufficient data for assessment.",
    }


def _assess_liver(params: list[dict], age: int, gender: str) -> dict:
    """Assess Liver Disease risk from SGOT and SGPT."""
    sgot = _get_value(params, "SGOT")
    sgpt = _get_value(params, "SGPT")
    details_parts: list[str] = []
    risk_score = 0.0

    sgot_elevated = False
    sgpt_elevated = False

    if sgot is not None:
        if sgot > 80:
            risk_score += 35
            sgot_elevated = True
            details_parts.append(f"SGOT {sgot} U/L is significantly elevated (>80)")
        elif sgot > 40:
            risk_score += 20
            sgot_elevated = True
            details_parts.append(f"SGOT {sgot} U/L is elevated (>40)")
        else:
            details_parts.append(f"SGOT {sgot} U/L is normal")

    if sgpt is not None:
        if sgpt > 80:
            risk_score += 35
            sgpt_elevated = True
            details_parts.append(f"SGPT {sgpt} U/L is significantly elevated (>80)")
        elif sgpt > 40:
            risk_score += 20
            sgpt_elevated = True
            details_parts.append(f"SGPT {sgpt} U/L is elevated (>40)")
        else:
            details_parts.append(f"SGPT {sgpt} U/L is normal")

    # Both elevated together is a stronger signal
    if sgot_elevated and sgpt_elevated:
        risk_score += 15
        details_parts.append("Both liver enzymes elevated simultaneously increases concern")

    risk_score = _clamp(risk_score)

    if risk_score >= 55:
        level = RiskLevelEnum.HIGH
    elif risk_score >= 20:
        level = RiskLevelEnum.MEDIUM
    else:
        level = RiskLevelEnum.LOW

    return {
        "disease_name": DiseaseEnum.LIVER_DISEASE.value,
        "risk_level": level.value,
        "confidence_percentage": round(risk_score, 2),
        "details": "; ".join(details_parts) if details_parts else "Insufficient data for assessment.",
    }


def _assess_kidney(params: list[dict], age: int, gender: str) -> dict:
    """Assess Kidney Disease risk from creatinine and uric acid."""
    creatinine = _get_value(params, "CREATININE")
    uric_acid = _get_value(params, "URIC_ACID")
    details_parts: list[str] = []
    risk_score = 0.0

    if creatinine is not None:
        if creatinine > 1.5:
            risk_score += 45
            details_parts.append(f"Creatinine {creatinine} mg/dL is significantly elevated (>1.5)")
        elif creatinine > 1.3:
            risk_score += 30
            details_parts.append(f"Creatinine {creatinine} mg/dL is mildly elevated (1.3–1.5)")
        elif creatinine >= 1.0:
            risk_score += 10
            details_parts.append(f"Creatinine {creatinine} mg/dL is borderline (1.0–1.3)")
        else:
            details_parts.append(f"Creatinine {creatinine} mg/dL is normal")

    if uric_acid is not None:
        if uric_acid > 8.0:
            risk_score += 30
            details_parts.append(f"Uric acid {uric_acid} mg/dL is significantly elevated (>8.0)")
        elif uric_acid > 7.0:
            risk_score += 20
            details_parts.append(f"Uric acid {uric_acid} mg/dL is elevated (>7.0)")
        else:
            details_parts.append(f"Uric acid {uric_acid} mg/dL is normal")

    risk_score = _clamp(risk_score)

    if risk_score >= 50:
        level = RiskLevelEnum.HIGH
    elif risk_score >= 20:
        level = RiskLevelEnum.MEDIUM
    else:
        level = RiskLevelEnum.LOW

    return {
        "disease_name": DiseaseEnum.KIDNEY_DISEASE.value,
        "risk_level": level.value,
        "confidence_percentage": round(risk_score, 2),
        "details": "; ".join(details_parts) if details_parts else "Insufficient data for assessment.",
    }


def _assess_heart(params: list[dict], age: int, gender: str) -> dict:
    """Assess Heart Disease risk from the lipid panel."""
    ldl = _get_value(params, "LDL")
    hdl = _get_value(params, "HDL")
    trig = _get_value(params, "TRIGLYCERIDES")
    chol = _get_value(params, "CHOLESTEROL")
    details_parts: list[str] = []
    risk_score = 0.0

    if ldl is not None:
        if ldl > 190:
            risk_score += 30
            details_parts.append(f"LDL {ldl} mg/dL is very high (>190)")
        elif ldl > 160:
            risk_score += 25
            details_parts.append(f"LDL {ldl} mg/dL is high (>160)")
        elif ldl > 130:
            risk_score += 15
            details_parts.append(f"LDL {ldl} mg/dL is borderline high (130–159)")
        else:
            details_parts.append(f"LDL {ldl} mg/dL is desirable")

    if hdl is not None:
        if hdl < 35:
            risk_score += 20
            details_parts.append(f"HDL {hdl} mg/dL is very low (<35, significant risk factor)")
        elif hdl < 40:
            risk_score += 15
            details_parts.append(f"HDL {hdl} mg/dL is low (<40, adds cardiovascular risk)")
        else:
            details_parts.append(f"HDL {hdl} mg/dL is adequate")

    if trig is not None:
        if trig > 500:
            risk_score += 25
            details_parts.append(f"Triglycerides {trig} mg/dL are very high (>500)")
        elif trig > 200:
            risk_score += 15
            details_parts.append(f"Triglycerides {trig} mg/dL are high (>200)")
        else:
            details_parts.append(f"Triglycerides {trig} mg/dL are normal")

    if chol is not None:
        if chol > 280:
            risk_score += 20
            details_parts.append(f"Total cholesterol {chol} mg/dL is very high (>280)")
        elif chol > 240:
            risk_score += 15
            details_parts.append(f"Total cholesterol {chol} mg/dL is high (>240)")
        elif chol > 200:
            risk_score += 5
            details_parts.append(f"Total cholesterol {chol} mg/dL is borderline (200–239)")
        else:
            details_parts.append(f"Total cholesterol {chol} mg/dL is desirable")

    # Age and gender modifiers
    if age > 55:
        risk_score += 5
        details_parts.append("Age >55 adds minor cardiovascular risk factor")
    if gender.lower() == "male" and age > 45:
        risk_score += 3
        details_parts.append("Male gender with age >45 adds minor risk factor")

    risk_score = _clamp(risk_score)

    if risk_score >= 50:
        level = RiskLevelEnum.HIGH
    elif risk_score >= 20:
        level = RiskLevelEnum.MEDIUM
    else:
        level = RiskLevelEnum.LOW

    return {
        "disease_name": DiseaseEnum.HEART_DISEASE.value,
        "risk_level": level.value,
        "confidence_percentage": round(risk_score, 2),
        "details": "; ".join(details_parts) if details_parts else "Insufficient data for assessment.",
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def predict_risks(
    parameters: list[dict],
    patient_age: int,
    patient_gender: str,
) -> List[dict]:
    """
    Run rule-based risk predictions for six disease categories.

    This function evaluates the patient's lab parameters against
    clinically-informed thresholds, adjusted for age and gender.

    Args:
        parameters: List of parameter dicts (as returned by
            ``gemini_client.parse_report``).
        patient_age: Patient's age in years.
        patient_gender: Patient's gender ("male" / "female" / "other").

    Returns:
        List of risk prediction dicts, each containing:
            - disease_name (str)
            - risk_level (str: LOW / MEDIUM / HIGH)
            - confidence_percentage (float: 0-100)
            - details (str: human-readable reasoning)

    Note:
        This is a placeholder engine using hand-crafted rules.
        It will be replaced with trained sklearn models in a future
        release. The function signature will remain unchanged.
    """
    if not parameters:
        logger.warning("predict_risks called with no parameters.")
        return []

    assessors = [
        _assess_diabetes,
        _assess_anemia,
        _assess_thyroid,
        _assess_liver,
        _assess_kidney,
        _assess_heart,
    ]

    predictions: List[dict] = []
    for assessor in assessors:
        try:
            result = assessor(parameters, patient_age, patient_gender)
            predictions.append(result)
            logger.debug(
                "Risk assessment – %s: %s (%.1f%%)",
                result["disease_name"],
                result["risk_level"],
                result["confidence_percentage"],
            )
        except Exception as exc:
            logger.error(
                "Risk assessor %s failed: %s",
                assessor.__name__, exc, exc_info=True,
            )

    logger.info(
        "Risk prediction complete: %d diseases assessed for %d parameters.",
        len(predictions), len(parameters),
    )
    return predictions
