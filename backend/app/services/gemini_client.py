"""
BioLens AI - AI Client (supports OpenRouter + Google Gemini)
Handles structured report parsing, AI interpretations, summaries, and RAG chat.
OpenRouter takes priority when OPENROUTER_API_KEY is set.
"""
import json
import logging
from typing import List, Dict, Optional

from app.core.config import settings

logger = logging.getLogger("biolens_ai")

# --------------------------------------------------------------------------- #
#  Provider setup
# --------------------------------------------------------------------------- #
USE_OPENROUTER = bool(settings.OPENROUTER_API_KEY)
USE_GEMINI = bool(settings.GEMINI_API_KEY) and not USE_OPENROUTER

# OpenRouter client (OpenAI-compatible)
openrouter_client = None
if USE_OPENROUTER:
    try:
        from openai import OpenAI
        openrouter_client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.OPENROUTER_API_KEY,
        )
        OPENROUTER_MODEL = "google/gemini-2.0-flash-001"
        logger.info(f"AI Provider: OpenRouter ({OPENROUTER_MODEL})")
    except ImportError:
        logger.error("openai package not installed. Run: pip install openai")
        USE_OPENROUTER = False

# Native Gemini client
genai_module = None
if USE_GEMINI:
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        genai_module = genai
        GEMINI_MODEL = "gemini-2.0-flash"
        logger.info(f"AI Provider: Google Gemini ({GEMINI_MODEL})")
    except Exception as e:
        logger.error(f"Failed to configure Gemini: {e}")
        USE_GEMINI = False

if not USE_OPENROUTER and not USE_GEMINI:
    logger.warning(
        "No AI provider configured! Set OPENROUTER_API_KEY or GEMINI_API_KEY in .env"
    )

MEDICAL_DISCLAIMER = (
    "\n\n⚕️ **Disclaimer:** BioLens AI provides informational analysis based on "
    "extracted laboratory report data. It does not provide medical diagnoses, treatment "
    "plans, or clinical decisions. Please consult a licensed healthcare professional "
    "for medical advice."
)

TARGET_PARAMETERS = [
    "HEMOGLOBIN", "RBC", "WBC", "PLATELETS",
    "HBA1C", "BLOOD_SUGAR",
    "TSH", "T3", "T4",
    "HDL", "LDL", "TRIGLYCERIDES", "CHOLESTEROL",
    "CREATININE", "URIC_ACID",
    "SGOT", "SGPT"
]


# --------------------------------------------------------------------------- #
#  Unified helpers
# --------------------------------------------------------------------------- #
def _call_ai(prompt: str, *, temperature: float = 0.3, json_mode: bool = False) -> str:
    """Route a prompt to whichever AI provider is configured."""
    if USE_OPENROUTER and openrouter_client:
        return _call_openrouter(prompt, temperature=temperature, json_mode=json_mode)
    elif USE_GEMINI and genai_module:
        return _call_gemini(prompt, temperature=temperature, json_mode=json_mode)
    else:
        raise RuntimeError(
            "No AI provider configured. Set OPENROUTER_API_KEY or GEMINI_API_KEY in backend/.env"
        )


def _call_openrouter(prompt: str, *, temperature: float, json_mode: bool) -> str:
    """Call OpenRouter via OpenAI-compatible API."""
    kwargs = {
        "model": OPENROUTER_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "extra_headers": {
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "BioLens AI",
        },
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    response = openrouter_client.chat.completions.create(**kwargs)
    return response.choices[0].message.content.strip()


def _call_gemini(prompt: str, *, temperature: float, json_mode: bool) -> str:
    """Call native Google Gemini API."""
    gen_config_args = {"temperature": temperature}
    if json_mode:
        gen_config_args["response_mime_type"] = "application/json"

    model = genai_module.GenerativeModel(GEMINI_MODEL)
    response = model.generate_content(
        prompt,
        generation_config=genai_module.GenerationConfig(**gen_config_args),
    )
    return response.text.strip()


# --------------------------------------------------------------------------- #
#  Public API (same signatures as before)
# --------------------------------------------------------------------------- #
def parse_report(raw_text: str) -> List[Dict]:
    """
    Use AI to extract structured medical parameters from raw OCR text.
    Returns a list of parameter dictionaries.
    """
    if not raw_text or len(raw_text.strip()) < 20:
        logger.warning("Raw text too short for parameter extraction")
        return []

    prompt = f"""You are an expert medical laboratory data extraction engine.
Analyze the following raw OCR text from a medical blood test report. Extract values for these parameters:
{', '.join(TARGET_PARAMETERS)}

For each parameter found, provide:
- parameter_name: exactly one of the listed names (uppercase)
- parameter_value: the numeric value (as a number, not string)
- unit: the measurement unit (e.g., g/dL, k/uL, mg/dL, %, mIU/L, U/L)
- reference_range_min: lower bound of normal range
- reference_range_max: upper bound of normal range
- status: NORMAL if within range, LOW if below min, HIGH if above max, CRITICAL if dangerously out of range

Respond ONLY with a valid JSON array. Do not hallucinate values - only extract what is explicitly found in the text. If a parameter is not mentioned, omit it entirely.

Raw OCR Text:
{raw_text[:4000]}"""

    try:
        result_text = _call_ai(prompt, temperature=0.1, json_mode=True)
        parsed = json.loads(result_text)

        if isinstance(parsed, list):
            valid_params = []
            for p in parsed:
                if (p.get("parameter_name") in TARGET_PARAMETERS
                        and isinstance(p.get("parameter_value"), (int, float))):
                    valid_params.append(p)
            logger.info(f"AI extracted {len(valid_params)} valid parameters")
            return valid_params
        elif isinstance(parsed, dict) and "parameters" in parsed:
            # Some models wrap in {"parameters": [...]}
            params_list = parsed["parameters"]
            valid_params = []
            for p in params_list:
                if (p.get("parameter_name") in TARGET_PARAMETERS
                        and isinstance(p.get("parameter_value"), (int, float))):
                    valid_params.append(p)
            logger.info(f"AI extracted {len(valid_params)} valid parameters (wrapped)")
            return valid_params
        else:
            logger.warning("AI returned unexpected JSON structure")
            return []

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI JSON response: {e}")
        return []
    except Exception as e:
        logger.error(f"AI parse_report failed: {e}")
        return []


def generate_interpretations(
    parameters: List[Dict],
    patient_age: int,
    patient_gender: str
) -> Dict[str, str]:
    """
    Generate patient-friendly explanations for abnormal values.
    Returns dict mapping parameter_name -> interpretation text.
    """
    abnormal = [p for p in parameters if p.get("status") in ("LOW", "HIGH", "CRITICAL")]
    if not abnormal:
        return {}

    abnormal_desc = "\n".join([
        f"- {p['parameter_name']}: {p['parameter_value']} {p.get('unit', '')} "
        f"(Status: {p['status']}, Normal Range: {p.get('reference_range_min', 'N/A')} - {p.get('reference_range_max', 'N/A')})"
        for p in abnormal
    ])

    prompt = f"""You are a compassionate medical health educator.

Patient Profile: {patient_gender}, {patient_age} years old.

The following blood test parameters are outside normal range:
{abnormal_desc}

For EACH abnormal parameter, provide a brief, supportive explanation in 2-3 sentences:
1. What this parameter measures
2. Common reasons it might be outside normal range
3. General recommendations

STRICT RULES:
- NEVER diagnose any disease. Use phrases like "this pattern may sometimes suggest..." or "this could be associated with..."
- Keep language simple and reassuring
- Do not cause unnecessary alarm

Respond as a JSON object where keys are the parameter names and values are the explanation strings.
Example: {{"HEMOGLOBIN": "Hemoglobin carries oxygen..."}}"""

    try:
        result_text = _call_ai(prompt, temperature=0.3, json_mode=True)
        result = json.loads(result_text)
        if isinstance(result, dict):
            logger.info(f"Generated interpretations for {len(result)} parameters")
            return result
        return {}

    except Exception as e:
        logger.error(f"AI generate_interpretations failed: {e}")
        return {}


def generate_summary(
    parameters: List[Dict],
    health_score: int,
    risk_predictions: List[Dict]
) -> str:
    """Generate a comprehensive patient-friendly report summary."""
    param_summary = "\n".join([
        f"- {p['parameter_name']}: {p['parameter_value']} {p.get('unit', '')} [{p.get('status', 'N/A')}]"
        for p in parameters
    ])

    risk_summary = "\n".join([
        f"- {r['disease_name']}: {r['risk_level']} risk ({r.get('confidence_percentage', 'N/A')}% confidence)"
        for r in risk_predictions
    ])

    prompt = f"""You are BioLens AI, a health intelligence assistant.

Generate a comprehensive but patient-friendly summary of this blood test analysis.

Health Score: {health_score}/100

Extracted Parameters:
{param_summary}

Risk Assessment:
{risk_summary}

Write a 3-4 paragraph summary that:
1. Opens with the overall health picture based on the score
2. Highlights key findings (especially any abnormal values)
3. Notes any elevated risk areas in a supportive, non-alarming tone
4. Ends with general wellness recommendations

STRICT RULES:
- Never diagnose diseases
- Use supportive, encouraging language
- Recommend consulting a healthcare professional for specific concerns
- Include the medical disclaimer at the end

Keep it under 300 words."""

    try:
        summary = _call_ai(prompt, temperature=0.4)
        return summary + MEDICAL_DISCLAIMER

    except Exception as e:
        logger.error(f"AI generate_summary failed: {e}")
        return (
            f"Your health score is {health_score}/100. "
            f"{len(parameters)} parameters were analyzed from your report. "
            "Please review the detailed parameter breakdown above for more information."
            + MEDICAL_DISCLAIMER
        )


def chat_with_context(
    user_message: str,
    patient_context: str,
    conversation_history: List[Dict]
) -> str:
    """
    RAG-grounded conversational AI using patient's medical data as context.
    """
    system_instruction = """You are BioLens AI Health Assistant, an expert health information companion.

ROLE:
- You explain medical reports, health scores, trends, and medical terms in simple language
- You help users understand their lab results and what they mean
- You compare reports and identify changes over time

STRICT RULES:
1. NEVER diagnose any disease or condition
2. NEVER prescribe medications or treatments
3. ALWAYS use phrases like "this may suggest...", "it could be helpful to...", "consider discussing with your doctor..."
4. ALWAYS include the medical disclaimer at the end of your response
5. ONLY use the provided patient data context to answer questions
6. If asked about something not in the data, politely say you can only discuss their uploaded reports
7. Keep responses concise but informative (under 250 words)

DISCLAIMER TO INCLUDE:
⚕️ Disclaimer: This is informational analysis only. Please consult a licensed healthcare professional for medical advice."""

    # Build conversation messages
    history_text = ""
    for msg in conversation_history[-10:]:
        role = "Patient" if msg["sender"] == "USER" else "BioLens AI"
        history_text += f"{role}: {msg['text']}\n\n"

    prompt = f"""{system_instruction}

PATIENT DATA CONTEXT:
{patient_context}

CONVERSATION HISTORY:
{history_text}

Patient's Current Question: {user_message}

Provide a helpful, accurate response based on the patient's data:"""

    try:
        if not USE_OPENROUTER and not USE_GEMINI:
            raise RuntimeError(
                "No AI provider configured. Set OPENROUTER_API_KEY or GEMINI_API_KEY in backend/.env"
            )
        return _call_ai(prompt, temperature=0.3)

    except Exception as e:
        error_str = str(e).lower()
        logger.error(f"AI chat_with_context failed: {e}")

        if "quota" in error_str or "resource_exhausted" in error_str or "429" in error_str:
            return (
                "⚠️ The AI service has temporarily reached its usage limit (API quota exceeded). "
                "This usually resets within a few minutes or at the start of the next billing cycle.\n\n"
                "**What you can do:**\n"
                "- Wait a minute and try again\n"
                "- If this persists, the daily free-tier limit may be exhausted — "
                "consider enabling billing on your AI provider for higher limits.\n\n"
                "⚕️ *Disclaimer: BioLens AI provides informational analysis only. "
                "Always consult a licensed healthcare professional for medical advice.*"
            )
        elif "credentials" in error_str or "api_key" in error_str or "authentication" in error_str or "unauthorized" in error_str:
            return (
                "⚠️ The AI service is not properly configured. The API key may be missing or invalid.\n\n"
                "Please check that a valid API key is set in the backend `.env` file "
                "and restart the server.\n\n"
                "⚕️ *Disclaimer: BioLens AI provides informational analysis only. "
                "Always consult a licensed healthcare professional for medical advice.*"
            )
        else:
            return (
                "I apologize, but I'm currently unable to process your request. "
                "Please try again in a moment.\n\n"
                "⚕️ *Disclaimer: BioLens AI provides informational analysis only. "
                "Always consult a licensed healthcare professional for medical advice.*"
            )
