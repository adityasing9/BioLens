import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import supabaseServer from '@/lib/supabaseServer';

const SYSTEM_INSTRUCTION = `You are BioLens AI Health Assistant, an expert health information companion.

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
⚕️ Disclaimer: This is informational analysis only. Please consult a licensed healthcare professional for medical advice.`;

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
  try {
    const user = await verifyUser(req);
    if (!user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, message } = await req.json();
    if (!conversationId || !message) {
      return NextResponse.json({ detail: 'Missing conversationId or message' }, { status: 400 });
    }

    // Verify conversation ownership
    const { data: conversation, error: convError } = await supabaseServer
      .from('ai_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ detail: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.user_id !== user.id) {
      return NextResponse.json({ detail: 'Unauthorized access to conversation' }, { status: 403 });
    }

    // 1. Insert user message in DB
    const userMsgId = crypto.randomUUID();
    const { error: userMsgError } = await supabaseServer
      .from('ai_messages')
      .insert({
        id: userMsgId,
        conversation_id: conversationId,
        sender: 'USER',
        message_text: message
      });

    if (userMsgError) {
      throw new Error(`Failed to save user message: ${userMsgError.message}`);
    }

    // 2. Fetch RAG Context (Latest report parameters & health stats)
    const { data: latestReport } = await supabaseServer
      .from('reports')
      .select('id, file_name, health_score, uploaded_at')
      .eq('user_id', user.id)
      .eq('upload_status', 'COMPLETED')
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .single();

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
        if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) {
          age--;
        }
      }
    }

    let patientContext = `Patient Demographics: Age ${age}, Gender ${gender}\n\n`;

    if (latestReport) {
      const { data: parameters } = await supabaseServer
        .from('report_parameters')
        .select('*')
        .eq('report_id', latestReport.id);

      const { data: risks } = await supabaseServer
        .from('risk_predictions')
        .select('*')
        .eq('report_id', latestReport.id);

      patientContext += `Latest Lab Report: ${latestReport.file_name} (Uploaded: ${latestReport.uploaded_at})\n`;
      patientContext += `Overall Health Score: ${latestReport.health_score}/100\n\n`;
      patientContext += `Extracted Blood Parameters:\n`;
      
      parameters?.forEach((p: any) => {
        patientContext += `- ${p.parameter_name}: ${p.parameter_value} ${p.unit} (Normal Range: ${p.reference_range_min}-${p.reference_range_max}, Status: ${p.status})\n`;
        if (p.ai_interpretation) {
          patientContext += `  AI Explanation: ${p.ai_interpretation}\n`;
        }
      });

      if (risks && risks.length > 0) {
        patientContext += `\nWellness Risk Indicators:\n`;
        risks.forEach((r: any) => {
          patientContext += `- ${r.disease_name}: ${r.risk_level} risk (${r.confidence_percentage}% confidence). Details: ${r.details}\n`;
        });
      }
    } else {
      patientContext += `No reports have been uploaded yet.`;
    }

    // 3. Fetch recent message history (last 10 messages)
    const { data: history } = await supabaseServer
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10);

    let historyText = '';
    history?.forEach((m: any) => {
      const role = m.sender === 'USER' ? 'Patient' : 'BioLens AI';
      historyText += `${role}: ${m.message_text}\n\n`;
    });

    // 4. Construct prompt for Gemini
    const prompt = `${SYSTEM_INSTRUCTION}

PATIENT DATA CONTEXT:
${patientContext}

CONVERSATION HISTORY:
${historyText}
Patient: ${message}
BioLens AI:`;

    let aiReply = '';

    if (process.env.GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      aiReply = result.response.text();
    } else if (process.env.OPENROUTER_API_KEY) {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API failed: ${response.statusText}`);
      }

      const resData = await response.json();
      aiReply = resData.choices[0].message.content;
    } else {
      throw new Error('No AI provider keys configured in Vercel environment.');
    }

    // 5. Save assistant response in DB
    const assistantMsgId = crypto.randomUUID();
    const { data: savedMsg, error: assistantMsgError } = await supabaseServer
      .from('ai_messages')
      .insert({
        id: assistantMsgId,
        conversation_id: conversationId,
        sender: 'ASSISTANT',
        message_text: aiReply,
        source_reports: latestReport ? [latestReport.file_name] : []
      })
      .select()
      .single();

    if (assistantMsgError) {
      throw new Error(`Failed to save assistant message: ${assistantMsgError.message}`);
    }

    // 6. Update conversation timestamp
    await supabaseServer
      .from('ai_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return NextResponse.json(savedMsg);
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ detail: error.message || 'Internal server error' }, { status: 500 });
  }
}
