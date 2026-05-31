import { NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import supabaseServer from '@/lib/supabaseServer';

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

function generatePDF(reportData: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      // Header Band
      doc.rect(0, 0, 612, 100).fill('#0f172a');
      doc.fillColor('#38bdf8').fontSize(22).font('Helvetica-Bold').text('BioLens AI', 50, 30);
      doc.fillColor('#94a3b8').fontSize(12).font('Helvetica').text('Health Report Summary & Analysis', 50, 58);
      
      // Patient Info Section
      doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold').text('PATIENT REPORT PROFILE', 50, 130);
      doc.moveTo(50, 148).lineTo(562, 148).strokeColor('#cbd5e1').lineWidth(1).stroke();
      
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#475569');
      doc.text('Patient Name:', 50, 160);
      doc.text('Gender:', 50, 175);
      doc.text('Age:', 50, 190);
      
      doc.font('Helvetica').fillColor('#0f172a');
      doc.text(reportData.patient_name || 'N/A', 150, 160);
      doc.text(reportData.patient_gender || 'N/A', 150, 175);
      doc.text(`${reportData.patient_age || 'N/A'} years`, 150, 190);

      doc.font('Helvetica-Bold').fillColor('#475569');
      doc.text('Report File:', 300, 160);
      doc.text('Date Uploaded:', 300, 175);
      doc.text('Health Score:', 300, 190);
      
      doc.font('Helvetica').fillColor('#0f172a');
      doc.text(reportData.file_name || 'N/A', 400, 160);
      doc.text(reportData.uploaded_at ? new Date(reportData.uploaded_at).toLocaleDateString() : 'N/A', 400, 175);
      
      // Health Score Pill
      const score = reportData.health_score || 0;
      let scoreColor = '#ef4444'; // Red
      if (score >= 85) scoreColor = '#06b6d4'; // Cyan
      else if (score >= 70) scoreColor = '#22c55e'; // Green
      else if (score >= 50) scoreColor = '#f59e0b'; // Amber

      doc.fillColor(scoreColor).font('Helvetica-Bold').text(`${score}/100 (${reportData.grade || 'N/A'})`, 400, 190);

      // Blood Parameters Table
      doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold').text('EXTRACTED BLOOD PARAMETERS', 50, 230);
      doc.moveTo(50, 248).lineTo(562, 248).strokeColor('#cbd5e1').lineWidth(1).stroke();

      // Table Header
      let y = 260;
      doc.rect(50, y, 512, 20).fill('#f1f5f9');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569');
      doc.text('Parameter Name', 60, y + 6);
      doc.text('Value', 200, y + 6);
      doc.text('Reference Range', 300, y + 6);
      doc.text('Unit', 420, y + 6);
      doc.text('Status', 480, y + 6);

      y += 20;

      // Table Rows
      doc.font('Helvetica').fontSize(9).fillColor('#0f172a');
      const params = reportData.parameters || [];
      
      if (params.length === 0) {
        doc.text('No matching lab parameters extracted from this report.', 60, y + 10);
        y += 30;
      } else {
        params.forEach((p: any, idx: number) => {
          if (y > 700) {
            doc.addPage();
            y = 50;
            // Draw a mini header for the new page
            doc.rect(50, y, 512, 20).fill('#f1f5f9');
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569');
            doc.text('Parameter Name', 60, y + 6);
            doc.text('Value', 200, y + 6);
            doc.text('Reference Range', 300, y + 6);
            doc.text('Unit', 420, y + 6);
            doc.text('Status', 480, y + 6);
            y += 20;
            doc.font('Helvetica').fontSize(9).fillColor('#0f172a');
          }

          // Alternating row background
          if (idx % 2 === 1) {
            doc.rect(50, y, 512, 20).fill('#f8fafc');
          }

          doc.fillColor('#0f172a');
          doc.text(p.parameter_name || '', 60, y + 6);
          doc.text(String(p.parameter_value || ''), 200, y + 6);
          doc.text(`${p.reference_range_min} - ${p.reference_range_max}`, 300, y + 6);
          doc.text(p.unit || '', 420, y + 6);

          // Status Badge Color
          const status = (p.status || '').toUpperCase();
          let statusColor = '#22c55e'; // Green (NORMAL)
          if (status === 'LOW') statusColor = '#f59e0b'; // Amber
          else if (status === 'HIGH') statusColor = '#ea580c'; // Orange
          else if (status === 'CRITICAL') statusColor = '#ef4444'; // Red

          doc.fillColor(statusColor).font('Helvetica-Bold');
          doc.text(status, 480, y + 6);
          doc.font('Helvetica');
          
          y += 20;
        });
      }

      y += 20;

      // Risk Predictions Section
      if (y > 650) {
        doc.addPage();
        y = 50;
      }

      doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold').text('WELLNESS RISK ASSESSMENT', 50, y);
      doc.moveTo(50, y + 18).lineTo(562, y + 18).strokeColor('#cbd5e1').lineWidth(1).stroke();
      y += 30;

      const risks = reportData.risk_predictions || [];
      if (risks.length === 0) {
        doc.fontSize(10).font('Helvetica').fillColor('#475569').text('No wellness risk indicators calculated.', 50, y);
        y += 20;
      } else {
        risks.forEach((r: any) => {
          if (y > 700) {
            doc.addPage();
            y = 50;
          }

          let riskColor = '#22c55e';
          if (r.risk_level === 'MEDIUM') riskColor = '#f59e0b';
          else if (r.risk_level === 'HIGH') riskColor = '#ef4444';

          doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text(r.disease_name?.replace('_', ' ') || '', 50, y);
          doc.fillColor(riskColor).text(`${r.risk_level} RISK (${r.confidence_percentage}% confidence)`, 220, y);
          
          y += 15;
          doc.fontSize(9).font('Helvetica').fillColor('#475569').text(r.details || '', 50, y, { width: 512 });
          y += 25;
        });
      }

      y += 20;

      // AI Summary Section
      if (y > 600) {
        doc.addPage();
        y = 50;
      }

      doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold').text('AI REPORT SUMMARY', 50, y);
      doc.moveTo(50, y + 18).lineTo(562, y + 18).strokeColor('#cbd5e1').lineWidth(1).stroke();
      y += 30;

      doc.fontSize(10).font('Helvetica').fillColor('#334155');
      
      const summaryText = reportData.ai_summary || 'Summary not generated.';
      doc.text(summaryText, 50, y, { width: 512, align: 'justify' });

      // Medical Disclaimer at the very bottom
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#64748b');
        
        // Footer Line
        doc.moveTo(50, 750).lineTo(562, 750).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
        
        // Disclaimer Text
        doc.text(
          '⚕ Disclaimer: BioLens AI provides informational analysis based on laboratory reports. ' +
          'It is not a substitute for professional medical advice, diagnosis, or treatment.',
          50, 760, { width: 512, align: 'center' }
        );
      }

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyUser(req);
    if (!user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }

    const { id: reportId } = await params;

    // Fetch report details
    const { data: report, error: reportError } = await supabaseServer
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ detail: 'Report not found' }, { status: 404 });
    }

    if (report.user_id !== user.id) {
      return NextResponse.json({ detail: 'Unauthorized to access this report' }, { status: 403 });
    }

    // Fetch parameters
    const { data: parameters } = await supabaseServer
      .from('report_parameters')
      .select('*')
      .eq('report_id', reportId);

    // Fetch risk predictions
    const { data: riskPredictions } = await supabaseServer
      .from('risk_predictions')
      .select('*')
      .eq('report_id', reportId);

    // Fetch health score
    const { data: healthScore } = await supabaseServer
      .from('health_scores')
      .select('*')
      .eq('report_id', reportId)
      .single();

    // Fetch user details for demographics
    const { data: profile } = await supabaseServer
      .from('users')
      .select('first_name, last_name, date_of_birth, gender')
      .eq('id', user.id)
      .single();

    let age = 30;
    if (profile?.date_of_birth) {
      const dob = new Date(profile.date_of_birth);
      const today = new Date();
      age = today.getFullYear() - dob.getFullYear();
      if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) {
        age--;
      }
    }

    const reportData = {
      patient_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Patient',
      patient_gender: profile?.gender || 'N/A',
      patient_age: age,
      file_name: report.file_name,
      uploaded_at: report.uploaded_at,
      health_score: report.health_score || healthScore?.score || 0,
      grade: healthScore?.grade || 'N/A',
      parameters: parameters || [],
      risk_predictions: riskPredictions || [],
      ai_summary: report.ai_summary || ''
    };

    const pdfBuffer = await generatePDF(reportData);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="BioLens_Report_${reportId.slice(0, 8)}.pdf"`,
        'Content-Length': String(pdfBuffer.length)
      }
    });

  } catch (error: any) {
    console.error('PDF generation route error:', error);
    return NextResponse.json({ detail: error.message || 'Internal server error' }, { status: 500 });
  }
}
