// BioLens AI - Health Scoring and Risk Assessment Engine (Transcribed from Python)

export const PARAMETER_WEIGHTS: Record<string, number> = {
  HEMOGLOBIN: 8,
  RBC: 6,
  WBC: 6,
  PLATELETS: 5,
  HBA1C: 8,
  BLOOD_SUGAR: 7,
  TSH: 5,
  T3: 4,
  T4: 4,
  HDL: 6,
  LDL: 7,
  TRIGLYCERIDES: 5,
  CHOLESTEROL: 6,
  CREATININE: 6,
  URIC_ACID: 5,
  SGOT: 6,
  SGPT: 6,
};

function scoreParameter(value: number, rangeMin: number, rangeMax: number, status: string): number {
  const rangeSpan = rangeMax - rangeMin;
  if (rangeSpan <= 0) {
    return status === 'NORMAL' ? 100 : 50;
  }

  const mid = (rangeMin + rangeMax) / 2.0;

  if (status === 'NORMAL') {
    const deviationFromMid = Math.abs(value - mid) / (rangeSpan / 2.0);
    const score = 100 - Math.floor(deviationFromMid * 20);
    return Math.max(80, Math.min(100, score));
  }

  let distance = 0;
  if (value < rangeMin) {
    distance = rangeMin - value;
  } else {
    distance = value - rangeMax;
  }

  const relativeDeviation = distance / rangeSpan;

  if (status === 'CRITICAL') {
    const score = Math.max(0, Math.floor(39 - relativeDeviation * 40));
    return Math.min(39, score);
  } else {
    // LOW or HIGH
    const score = Math.max(40, Math.floor(79 - relativeDeviation * 40));
    return Math.min(79, score);
  }
}

function determineGrade(score: number): string {
  if (score >= 85) return 'EXCELLENT';
  if (score >= 70) return 'GOOD';
  if (score >= 50) return 'MODERATE';
  return 'POOR';
}

export interface ParameterInput {
  parameter_name: string;
  parameter_value: number;
  reference_range_min: number;
  reference_range_max: number;
  status: string;
  unit?: string;
}

export function calculateHealthScore(parameters: ParameterInput[]) {
  if (!parameters || parameters.length === 0) {
    return { score: 0, grade: 'POOR', factors: {} };
  }

  const factors: Record<string, number> = {};
  let weightedSum = 0.0;
  let totalWeight = 0;

  for (const param of parameters) {
    const name = param.parameter_name.toUpperCase();
    const weight = PARAMETER_WEIGHTS[name] || 0;

    if (weight === 0) continue;

    const value = Number(param.parameter_value);
    const rangeMin = Number(param.reference_range_min);
    const rangeMax = Number(param.reference_range_max);
    const status = (param.status || 'NORMAL').toUpperCase();

    if (isNaN(value) || isNaN(rangeMin) || isNaN(rangeMax)) continue;

    const paramScore = scoreParameter(value, rangeMin, rangeMax, status);
    factors[name] = paramScore;

    weightedSum += paramScore * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    return { score: 0, grade: 'POOR', factors };
  }

  const overallScore = Math.max(0, Math.min(100, Math.round(weightedSum / totalWeight)));
  const grade = determineGrade(overallScore);

  return { score: overallScore, grade, factors };
}

// ---------------------------------------------------------------------------
// Disease-specific risk assessors
// ---------------------------------------------------------------------------

function getValue(params: ParameterInput[], name: string): number | null {
  const p = params.find(param => param.parameter_name.toUpperCase() === name.toUpperCase());
  if (!p) return null;
  const val = Number(p.parameter_value);
  return isNaN(val) ? null : val;
}

function getStatus(params: ParameterInput[], name: string): string | null {
  const p = params.find(param => param.parameter_name.toUpperCase() === name.toUpperCase());
  return p ? (p.status || '').toUpperCase() : null;
}

function clamp(value: number, lo = 0.0, hi = 100.0): number {
  return Math.max(lo, Math.min(hi, value));
}

function assessDiabetes(params: ParameterInput[], age: number, gender: string) {
  const hba1c = getValue(params, 'HBA1C');
  const sugar = getValue(params, 'BLOOD_SUGAR');
  const detailsParts: string[] = [];
  let riskScore = 0.0;

  if (hba1c !== null) {
    if (hba1c >= 6.5) {
      riskScore += 50;
      detailsParts.push(`HbA1c is ${hba1c}% (≥6.5% is diabetic range)`);
    } else if (hba1c >= 5.7) {
      riskScore += 30;
      detailsParts.push(`HbA1c is ${hba1c}% (5.7–6.4% is pre-diabetic range)`);
    } else {
      detailsParts.push(`HbA1c is ${hba1c}% (normal)`);
    }
  }

  if (sugar !== null) {
    if (sugar >= 126) {
      riskScore += 40;
      detailsParts.push(`Fasting blood sugar is ${sugar} mg/dL (≥126 is diabetic)`);
    } else if (sugar >= 100) {
      riskScore += 20;
      detailsParts.push(`Fasting blood sugar is ${sugar} mg/dL (100–125 is pre-diabetic)`);
    } else {
      detailsParts.push(`Fasting blood sugar is ${sugar} mg/dL (normal)`);
    }
  }

  if (age > 45) {
    riskScore += 5;
    detailsParts.push('Age >45 adds minor risk factor');
  }

  riskScore = clamp(riskScore);

  let level = 'LOW';
  if (riskScore >= 60) level = 'HIGH';
  else if (riskScore >= 25) level = 'MEDIUM';

  return {
    disease_name: 'DIABETES',
    risk_level: level,
    confidence_percentage: Math.round(riskScore * 100) / 100,
    details: detailsParts.length > 0 ? detailsParts.join('; ') : 'Insufficient data for assessment.',
  };
}

function assessAnemia(params: ParameterInput[], age: number, gender: string) {
  const hb = getValue(params, 'HEMOGLOBIN');
  const rbc = getValue(params, 'RBC');
  const detailsParts: string[] = [];
  let riskScore = 0.0;

  if (hb !== null) {
    if (gender.toLowerCase() === 'female') {
      if (hb < 10) {
        riskScore += 55;
        detailsParts.push(`Haemoglobin ${hb} g/dL is significantly low for females (<10)`);
      } else if (hb < 12) {
        riskScore += 30;
        detailsParts.push(`Haemoglobin ${hb} g/dL is mildly low for females (normal ≥12)`);
      } else {
        detailsParts.push(`Haemoglobin ${hb} g/dL is normal for females`);
      }
    } else {
      if (hb < 10) {
        riskScore += 55;
        detailsParts.push(`Haemoglobin ${hb} g/dL is significantly low (<10)`);
      } else if (hb < 13) {
        riskScore += 30;
        detailsParts.push(`Haemoglobin ${hb} g/dL is mildly low for males (normal ≥13)`);
      } else {
        detailsParts.push(`Haemoglobin ${hb} g/dL is normal for males`);
      }
    }
  }

  if (rbc !== null) {
    const rbcStatus = getStatus(params, 'RBC');
    if (rbcStatus === 'LOW' || rbcStatus === 'CRITICAL') {
      riskScore += 20;
      detailsParts.push(`RBC count ${rbc} is below normal range`);
    } else {
      detailsParts.push(`RBC count ${rbc} is within normal range`);
    }
  }

  riskScore = clamp(riskScore);

  let level = 'LOW';
  if (riskScore >= 50) level = 'HIGH';
  else if (riskScore >= 25) level = 'MEDIUM';

  return {
    disease_name: 'ANEMIA',
    risk_level: level,
    confidence_percentage: Math.round(riskScore * 100) / 100,
    details: detailsParts.length > 0 ? detailsParts.join('; ') : 'Insufficient data for assessment.',
  };
}

function assessThyroid(params: ParameterInput[], age: number, gender: string) {
  const tsh = getValue(params, 'TSH');
  const t3 = getValue(params, 'T3');
  const t4 = getValue(params, 'T4');
  const detailsParts: string[] = [];
  let riskScore = 0.0;

  if (tsh !== null) {
    if (tsh < 0.4) {
      riskScore += 45;
      detailsParts.push(`TSH ${tsh} mIU/L is low (<0.4, may suggest hyperthyroidism)`);
    } else if (tsh > 4.0) {
      riskScore += 45;
      detailsParts.push(`TSH ${tsh} mIU/L is elevated (>4.0, may suggest hypothyroidism)`);
    } else if (tsh > 3.5) {
      riskScore += 15;
      detailsParts.push(`TSH ${tsh} mIU/L is borderline high`);
    } else if (tsh < 0.5) {
      riskScore += 15;
      detailsParts.push(`TSH ${tsh} mIU/L is borderline low`);
    } else {
      detailsParts.push(`TSH ${tsh} mIU/L is normal`);
    }
  }

  if (t3 !== null) {
    const t3Status = getStatus(params, 'T3');
    if (t3Status === 'LOW' || t3Status === 'HIGH' || t3Status === 'CRITICAL') {
      riskScore += 15;
      detailsParts.push(`T3 is ${t3Status.toLowerCase()} (${t3})`);
    } else {
      detailsParts.push(`T3 ${t3} is within normal range`);
    }
  }

  if (t4 !== null) {
    const t4Status = getStatus(params, 'T4');
    if (t4Status === 'LOW' || t4Status === 'HIGH' || t4Status === 'CRITICAL') {
      riskScore += 15;
      detailsParts.push(`T4 is ${t4Status.toLowerCase()} (${t4})`);
    } else {
      detailsParts.push(`T4 ${t4} is within normal range`);
    }
  }

  riskScore = clamp(riskScore);

  let level = 'LOW';
  if (riskScore >= 50) level = 'HIGH';
  else if (riskScore >= 20) level = 'MEDIUM';

  return {
    disease_name: 'THYROID_DISORDERS',
    risk_level: level,
    confidence_percentage: Math.round(riskScore * 100) / 100,
    details: detailsParts.length > 0 ? detailsParts.join('; ') : 'Insufficient data for assessment.',
  };
}

function assessLiver(params: ParameterInput[], age: number, gender: string) {
  const sgot = getValue(params, 'SGOT');
  const sgpt = getValue(params, 'SGPT');
  const detailsParts: string[] = [];
  let riskScore = 0.0;

  let sgotElevated = false;
  let sgptElevated = false;

  if (sgot !== null) {
    if (sgot > 80) {
      riskScore += 35;
      sgotElevated = true;
      detailsParts.push(`SGOT ${sgot} U/L is significantly elevated (>80)`);
    } else if (sgot > 40) {
      riskScore += 20;
      sgotElevated = true;
      detailsParts.push(`SGOT ${sgot} U/L is elevated (>40)`);
    } else {
      detailsParts.push(`SGOT ${sgot} U/L is normal`);
    }
  }

  if (sgpt !== null) {
    if (sgpt > 80) {
      riskScore += 35;
      sgptElevated = true;
      detailsParts.push(`SGPT ${sgpt} U/L is significantly elevated (>80)`);
    } else if (sgpt > 40) {
      riskScore += 20;
      sgptElevated = true;
      detailsParts.push(`SGPT ${sgpt} U/L is elevated (>40)`);
    } else {
      detailsParts.push(`SGPT ${sgpt} U/L is normal`);
    }
  }

  if (sgotElevated && sgptElevated) {
    riskScore += 15;
    detailsParts.push('Both liver enzymes elevated simultaneously increases concern');
  }

  riskScore = clamp(riskScore);

  let level = 'LOW';
  if (riskScore >= 55) level = 'HIGH';
  else if (riskScore >= 20) level = 'MEDIUM';

  return {
    disease_name: 'LIVER_DISEASE',
    risk_level: level,
    confidence_percentage: Math.round(riskScore * 100) / 100,
    details: detailsParts.length > 0 ? detailsParts.join('; ') : 'Insufficient data for assessment.',
  };
}

function assessKidney(params: ParameterInput[], age: number, gender: string) {
  const creatinine = getValue(params, 'CREATININE');
  const uricAcid = getValue(params, 'URIC_ACID');
  const detailsParts: string[] = [];
  let riskScore = 0.0;

  if (creatinine !== null) {
    if (creatinine > 1.5) {
      riskScore += 45;
      detailsParts.push(`Creatinine ${creatinine} mg/dL is significantly elevated (>1.5)`);
    } else if (creatinine > 1.3) {
      riskScore += 30;
      detailsParts.push(`Creatinine ${creatinine} mg/dL is mildly elevated (1.3–1.5)`);
    } else if (creatinine >= 1.0) {
      riskScore += 10;
      detailsParts.push(`Creatinine ${creatinine} mg/dL is borderline (1.0–1.3)`);
    } else {
      detailsParts.push(`Creatinine ${creatinine} mg/dL is normal`);
    }
  }

  if (uricAcid !== null) {
    if (uricAcid > 8.0) {
      riskScore += 30;
      detailsParts.push(`Uric acid ${uricAcid} mg/dL is significantly elevated (>8.0)`);
    } else if (uricAcid > 7.0) {
      riskScore += 20;
      detailsParts.push(`Uric acid ${uricAcid} mg/dL is elevated (>7.0)`);
    } else {
      detailsParts.push(`Uric acid ${uricAcid} mg/dL is normal`);
    }
  }

  riskScore = clamp(riskScore);

  let level = 'LOW';
  if (riskScore >= 50) level = 'HIGH';
  else if (riskScore >= 20) level = 'MEDIUM';

  return {
    disease_name: 'KIDNEY_DISEASE',
    risk_level: level,
    confidence_percentage: Math.round(riskScore * 100) / 100,
    details: detailsParts.length > 0 ? detailsParts.join('; ') : 'Insufficient data for assessment.',
  };
}

function assessHeart(params: ParameterInput[], age: number, gender: string) {
  const ldl = getValue(params, 'LDL');
  const hdl = getValue(params, 'HDL');
  const trig = getValue(params, 'TRIGLYCERIDES');
  const chol = getValue(params, 'CHOLESTEROL');
  const detailsParts: string[] = [];
  let riskScore = 0.0;

  if (ldl !== null) {
    if (ldl > 190) {
      riskScore += 30;
      detailsParts.push(`LDL ${ldl} mg/dL is very high (>190)`);
    } else if (ldl > 160) {
      riskScore += 25;
      detailsParts.push(`LDL ${ldl} mg/dL is high (>160)`);
    } else if (ldl > 130) {
      riskScore += 15;
      detailsParts.push(`LDL ${ldl} mg/dL is borderline high (130–159)`);
    } else {
      detailsParts.push(`LDL ${ldl} mg/dL is desirable`);
    }
  }

  if (hdl !== null) {
    if (hdl < 35) {
      riskScore += 20;
      detailsParts.push(`HDL ${hdl} mg/dL is very low (<35, significant risk factor)`);
    } else if (hdl < 40) {
      riskScore += 15;
      detailsParts.push(`HDL ${hdl} mg/dL is low (<40, adds cardiovascular risk)`);
    } else {
      detailsParts.push(`HDL ${hdl} mg/dL is adequate`);
    }
  }

  if (trig !== null) {
    if (trig > 500) {
      riskScore += 25;
      detailsParts.push(`Triglycerides ${trig} mg/dL are very high (>500)`);
    } else if (trig > 200) {
      riskScore += 15;
      detailsParts.push(`Triglycerides ${trig} mg/dL are high (>200)`);
    } else {
      detailsParts.push(`Triglycerides ${trig} mg/dL are normal`);
    }
  }

  if (chol !== null) {
    if (chol > 280) {
      riskScore += 20;
      detailsParts.push(`Total cholesterol ${chol} mg/dL is very high (>280)`);
    } else if (chol > 240) {
      riskScore += 15;
      detailsParts.push(`Total cholesterol ${chol} mg/dL is high (>240)`);
    } else if (chol > 200) {
      riskScore += 5;
      detailsParts.push(`Total cholesterol ${chol} mg/dL is borderline (200–239)`);
    } else {
      detailsParts.push(`Total cholesterol ${chol} mg/dL is desirable`);
    }
  }

  if (age > 55) {
    riskScore += 5;
    detailsParts.push('Age >55 adds minor cardiovascular risk factor');
  }
  if (gender.toLowerCase() === 'male' && age > 45) {
    riskScore += 3;
    detailsParts.push('Male gender with age >45 adds minor risk factor');
  }

  riskScore = clamp(riskScore);

  let level = 'LOW';
  if (riskScore >= 50) level = 'HIGH';
  else if (riskScore >= 20) level = 'MEDIUM';

  return {
    disease_name: 'HEART_DISEASE',
    risk_level: level,
    confidence_percentage: Math.round(riskScore * 100) / 100,
    details: detailsParts.length > 0 ? detailsParts.join('; ') : 'Insufficient data for assessment.',
  };
}

export function predictRisks(parameters: ParameterInput[], age: number, gender: string) {
  if (!parameters || parameters.length === 0) {
    return [];
  }

  const assessors = [
    assessDiabetes,
    assessAnemia,
    assessThyroid,
    assessLiver,
    assessKidney,
    assessHeart,
  ];

  const predictions = [];
  for (const assessor of assessors) {
    try {
      predictions.push(assessor(parameters, age, gender));
    } catch (e) {
      console.error(`Risk assessor failed:`, e);
    }
  }

  return predictions;
}
