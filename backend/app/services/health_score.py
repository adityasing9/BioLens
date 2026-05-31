"""
BioLens AI - Weighted Health Score Calculator
===============================================
Computes a 0-100 health score from extracted lab parameters using
clinically-informed weights and deviation-based scoring.
"""

import logging
from typing import Dict, Tuple

from app.models.report import ParameterEnum

logger = logging.getLogger('biolens_health_score')

# ---------------------------------------------------------------------------
# Parameter weights (must sum to 100)
# ---------------------------------------------------------------------------
PARAMETER_WEIGHTS: Dict[str, int] = {
    # Haematology
    ParameterEnum.HEMOGLOBIN.value:    8,
    ParameterEnum.RBC.value:           6,
    ParameterEnum.WBC.value:           6,
    ParameterEnum.PLATELETS.value:     5,
    # Diabetes markers
    ParameterEnum.HBA1C.value:         8,
    ParameterEnum.BLOOD_SUGAR.value:   7,
    # Thyroid panel
    ParameterEnum.TSH.value:           5,
    ParameterEnum.T3.value:            4,
    ParameterEnum.T4.value:            4,
    # Lipid panel
    ParameterEnum.HDL.value:           6,
    ParameterEnum.LDL.value:           7,
    ParameterEnum.TRIGLYCERIDES.value: 5,
    ParameterEnum.CHOLESTEROL.value:   6,
    # Kidney markers
    ParameterEnum.CREATININE.value:    6,
    ParameterEnum.URIC_ACID.value:     5,
    # Liver markers
    ParameterEnum.SGOT.value:          6,
    ParameterEnum.SGPT.value:          6,
}

# Sanity check at import time
assert sum(PARAMETER_WEIGHTS.values()) == 100, (
    f"Parameter weights must sum to 100, got {sum(PARAMETER_WEIGHTS.values())}"
)


# ---------------------------------------------------------------------------
# Per-parameter scoring logic
# ---------------------------------------------------------------------------
def _score_parameter(value: float, range_min: float, range_max: float, status: str) -> int:
    """
    Compute a 0-100 score for a single parameter based on its deviation
    from the normal range.

    Scoring tiers:
        NORMAL   →  80 – 100  (closer to mid-range = higher)
        LOW/HIGH →  40 – 79   (proportional to distance from boundary)
        CRITICAL →   0 – 39   (proportional to severity)

    Args:
        value: The measured parameter value.
        range_min: Lower bound of the normal reference range.
        range_max: Upper bound of the normal reference range.
        status: One of "NORMAL", "LOW", "HIGH", "CRITICAL".

    Returns:
        Integer score from 0 to 100.
    """
    range_span = range_max - range_min
    if range_span <= 0:
        # Degenerate range — treat as normal if value equals the target
        return 100 if status == "NORMAL" else 50

    mid = (range_min + range_max) / 2.0

    if status == "NORMAL":
        # Score 80-100 based on proximity to the midpoint
        deviation_from_mid = abs(value - mid) / (range_span / 2.0)
        # deviation_from_mid is 0 at midpoint, 1 at range boundary
        score = 100 - int(deviation_from_mid * 20)
        return max(80, min(100, score))

    # For abnormal values, calculate how far outside the range they are
    if value < range_min:
        distance = range_min - value
        boundary = range_min
    else:
        distance = value - range_max
        boundary = range_max

    # Normalise distance relative to range span
    relative_deviation = distance / range_span if range_span > 0 else 0

    if status == "CRITICAL":
        # Score 0-39: severe deviations get lower scores
        score = max(0, int(39 - relative_deviation * 40))
        return min(39, score)
    else:
        # LOW or HIGH — score 40-79
        score = max(40, int(79 - relative_deviation * 40))
        return min(79, score)


# ---------------------------------------------------------------------------
# Grade determination
# ---------------------------------------------------------------------------
def _determine_grade(score: int) -> str:
    """
    Map a numeric health score to a qualitative grade.

    Thresholds:
        >= 85  → EXCELLENT
        >= 70  → GOOD
        >= 50  → MODERATE
        <  50  → POOR
    """
    if score >= 85:
        return "EXCELLENT"
    elif score >= 70:
        return "GOOD"
    elif score >= 50:
        return "MODERATE"
    else:
        return "POOR"


# ---------------------------------------------------------------------------
# Main scoring function
# ---------------------------------------------------------------------------
def calculate_health_score(parameters: list[dict]) -> Tuple[int, str, Dict[str, int]]:
    """
    Calculate a weighted overall health score from extracted lab parameters.

    The score is computed as a weighted average of individual parameter
    scores, where each parameter's score reflects how close its value
    is to the normal range centre.

    Args:
        parameters: List of dicts, each containing at minimum:
            - parameter_name (str)
            - parameter_value (float | int)
            - reference_range_min (float | int)
            - reference_range_max (float | int)
            - status (str: NORMAL | LOW | HIGH | CRITICAL)

    Returns:
        A tuple of:
            - score (int): Overall health score 0-100.
            - grade (str): EXCELLENT | GOOD | MODERATE | POOR.
            - factors (dict): Maps each parameter name to its individual
              score (0-100) for transparency / drill-down UI.
    """
    if not parameters:
        logger.warning("calculate_health_score called with no parameters.")
        return (0, "POOR", {})

    factors: Dict[str, int] = {}
    weighted_sum = 0.0
    total_weight = 0

    for param in parameters:
        name = param.get("parameter_name", "").upper()
        weight = PARAMETER_WEIGHTS.get(name, 0)

        if weight == 0:
            logger.debug("Unknown or zero-weight parameter '%s' – skipping.", name)
            continue

        try:
            value = float(param["parameter_value"])
            range_min = float(param["reference_range_min"])
            range_max = float(param["reference_range_max"])
            status = param.get("status", "NORMAL").upper()
        except (KeyError, ValueError, TypeError) as exc:
            logger.warning("Skipping parameter '%s' due to bad data: %s", name, exc)
            continue

        param_score = _score_parameter(value, range_min, range_max, status)
        factors[name] = param_score

        weighted_sum += param_score * weight
        total_weight += weight

    if total_weight == 0:
        logger.warning("No weighted parameters found – returning score 0.")
        return (0, "POOR", factors)

    overall_score = int(round(weighted_sum / total_weight))
    overall_score = max(0, min(100, overall_score))

    grade = _determine_grade(overall_score)

    logger.info(
        "Health score calculated: %d (%s) from %d parameters (total weight: %d).",
        overall_score, grade, len(factors), total_weight,
    )

    return (overall_score, grade, factors)
