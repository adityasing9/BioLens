import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import supabaseServer from '@/lib/supabaseServer';
import { calculateHealthScore, predictRisks } from '@/lib/healthEngine';

const MEDICAL_DISCLAIMER = 
  "\n\n⚕️ **Disclaimer:** BioLens AI provides informational analysis based on " +
  "extracted laboratory report data. It does not provide medical diagnoses, treatment " +
  "plans, or clinical decisions. Please consult a licensed healthcare professional " +
  "for medical advice.";

const TARGET_PARAMETERS = [
  "HEMOGLOBIN", "RBC", "WBC", "PLATELETS",
  "HBA1C", "BLOOD_SUGAR",
  "TSH", "T3", "T4",
  "HDL", "LDL", "TRIGLYCERIDES", "CHOLESTEROL",
  "CREATININE", "URIC_ACID",
  "SGOT", "SGPT"
];

async function verifyUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabaseServer.auth.getUser(token);
  if (error || !user) {
    return null;
  }
  return user;
}

export async function POST(req: NextRequest) {
  let reportId = '';
  try {
    const user = await verifyUser(req);
    if (!user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    reportId = body.reportId;

    if (!reportId) {
      return NextResponse.json({ detail: 'No reportId provided' }, { status: 400 });
    }

    // 1. Fetch report details from database
    const { data: report, error: reportError } = await supabaseServer
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ detail: 'Report not found' }, { status: 404 });
    }

    if (report.user_id !== user.id) {
      return NextResponse.json({ detail: 'Unauthorized to process this report' }, { status: 403 });
    }

    // Update status to PROCESSING
    await supabaseServer
      .from('reports')
      .update({ upload_status: 'PROCESSING', status_message: 'Extracting data and analyzing...' })
      .eq('id', reportId);

    // 2. Fetch user details to get age and gender
    const { data: profile } = await supabaseServer
      .from('users')
      .select('date_of_birth, gender')
      .eq('id', user.id)
      .single();

    let age = 30;
    let gender = 'OTHER';
    if (profile) {
      gender = profile.gender || 'OTHER';
      if (profile.date_of_birth) {
        const dob = new Date(profile.date_of_birth);
        const today = new Date();
        age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
      }
    }

    // 3. Download file from Supabase storage
    const { data: fileBuffer, error: downloadError } = await supabaseServer.storage
      .from('reports')
      .download(report.file_path);

    if (downloadError || !fileBuffer) {
      throw new Error(`Failed to download report file: ${downloadError?.message || 'Empty file buffer'}`);
    }

    const fileBytes = await fileBuffer.arrayBuffer();
    const fileBase64 = Buffer.from(fileBytes).toString('base64');

    // 4. Prompt Gemini for OCR and analysis in a single call
    const prompt = `You are an expert medical laboratory data extraction engine and health advisor.
Analyze the attached blood test report. You must perform three tasks:

1. Extract values for these target parameters if they are explicitly mentioned in the report:
${TARGET_PARAMETERS.join(', ')}

For each extracted parameter, provide:
- parameter_name (exactly one of the listed names, uppercase)
- parameter_value (number, parse float from string if necessary)
- unit (string, e.g., g/dL, k/uL, mg/dL, %, mIU/L, U/L)
- reference_range_min (number)
- reference_range_max (number)
- status (NORMAL if within range, LOW if below min, HIGH if above max, CRITICAL if dangerously out of range)

2. Generate patient-friendly interpretations for any abnormal parameters (status is LOW, HIGH, or CRITICAL) based on patient profile: ${gender}, ${age} years old.
Strictest rules:
- NEVER diagnose diseases. Use words like "this pattern may suggest..." or "this could be related to..."
- Keep explanations to 2-3 sentences.
- Explain what the parameter is, common non-severe reasons, and general advice.

3. Generate a comprehensive summary of the findings under 250 words. Highlight any abnormal values or health patterns. Tone must be encouraging, compassionate, and non-alarming.

Return your response ONLY as a JSON object matching this schema:
{
  "extracted_parameters": [
    {
      "parameter_name": "HEMOGLOBIN",
      "parameter_value": 14.2,
      "unit": "g/dL",
      "reference_range_min": 12.0,
      "reference_range_max": 16.0,
      "status": "NORMAL"
    }
  ],
  "interpretations": {
    "WBC": "Explanation..."
  },
  "summary": "Summary text..."
}`;

    let resultJson = '';

    if (process.env.GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent([
        {
          inlineData: {
            data: fileBase64,
            mimeType: report.file_type || 'application/pdf'
          }
        },
        prompt
      ]);
      resultJson = result.response.text();
    } else if (process.env.OPENROUTER_API_KEY) {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${report.file_type || 'application/pdf'};base64,${fileBase64}`
                  }
                }
              ]
            }
          ],
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API failed: ${response.statusText}`);
      }

      const resData = await response.json();
      resultJson = resData.choices[0].message.content;
    } else {
      throw new Error('No AI provider keys configured in Vercel environment.');
    }

    // Clean JSON response (sometimes model outputs markdown code blocks like ```json ... ```)
    if (resultJson.includes('```')) {
      const start = resultJson.indexOf('{');
      const end = resultJson.lastIndexOf('}') + 1;
      resultJson = resultJson.substring(start, end);
    }

    const analysis = JSON.parse(resultJson);
    const extractedParams = analysis.extracted_parameters || [];
    const interpretations = analysis.interpretations || {};
    const summary = analysis.summary || 'Summary could not be generated.';

    // 5. Save report parameters
    for (const p of extractedParams) {
      const paramName = p.parameter_name.toUpperCase();
      const interp = interpretations[paramName] || null;

      await supabaseServer
        .from('report_parameters')
        .insert({
          id: crypto.randomUUID(),
          report_id: reportId,
          parameter_name: paramName,
          parameter_value: p.parameter_value,
          reference_range_min: p.reference_range_min,
          reference_range_max: p.reference_range_max,
          unit: p.unit,
          status: p.status,
          ai_interpretation: interp
        });
    }

    // 6. Calculate Health Score
    const { score, grade, factors } = calculateHealthScore(extractedParams);

    await supabaseServer
      .from('health_scores')
      .insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        report_id: reportId,
        score,
        grade,
        factors
      });

    // 7. Predict Risks
    const risks = predictRisks(extractedParams, age, gender);
    for (const r of risks) {
      await supabaseServer
        .from('risk_predictions')
        .insert({
          id: crypto.randomUUID(),
          user_id: user.id,
          report_id: reportId,
          disease_name: r.disease_name,
          risk_level: r.risk_level,
          confidence_percentage: r.confidence_percentage,
          details: r.details
        });
    }

    // 8. Update Report details
    const fullSummary = summary + MEDICAL_DISCLAIMER;
    await supabaseServer
      .from('reports')
      .update({
        upload_status: 'COMPLETED',
        status_message: 'Report analyzed successfully',
        health_score: score,
        ai_summary: fullSummary
      })
      .eq('id', reportId);

    // 9. Generate Notification
    const hasCritical = extractedParams.some((p: any) => p.status === 'CRITICAL');
    if (hasCritical) {
      await supabaseServer
        .from('notifications')
        .insert({
          id: crypto.randomUUID(),
          user_id: user.id,
          title: '⚠️ Critical Values Detected',
          message: `Your report '${report.file_name}' contains critical values that need immediate attention.`,
          type: 'CRITICAL_ALERT',
          is_read: false
        });
    } else {
      await supabaseServer
        .from('notifications')
        .insert({
          id: crypto.randomUUID(),
          user_id: user.id,
          title: '✅ Report Analyzed',
          message: `Your report '${report.file_name}' has been successfully analyzed. Health Score: ${score}/100.`,
          type: 'REPORT_ANALYZED',
          is_read: false
        });
    }

    return NextResponse.json({ status: 'success', message: 'Report processed successfully.', score });
  } catch (error: any) {
    console.error('Process report error:', error);

    if (reportId) {
      await supabaseServer
        .from('reports')
        .update({
          upload_status: 'FAILED',
          status_message: `Analysis failed: ${error.message?.slice(0, 150) || 'Internal error'}`
        })
        .eq('id', reportId);
    }

    return NextResponse.json({ detail: error.message || 'Internal server error' }, { status: 500 });
  }
}
