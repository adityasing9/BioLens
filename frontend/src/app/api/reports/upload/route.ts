import { NextRequest, NextResponse } from 'next/server';
import supabaseServer from '@/lib/supabaseServer';

const ALLOWED_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']);
const MAX_FILE_SIZE_MB = 15;

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

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ detail: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { detail: `Unsupported file type: ${file.type}. Allowed: PDF, PNG, JPEG.` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { detail: `File exceeds maximum size of ${MAX_FILE_SIZE_MB}MB` },
        { status: 400 }
      );
    }

    const reportId = crypto.randomUUID();
    const originalName = file.name || 'uploaded_report';
    const ext = originalName.includes('.') ? originalName.slice(originalName.lastIndexOf('.')) : '.pdf';
    const storagePath = `${user.id}/${reportId}${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseServer.storage
      .from('reports')
      .upload(storagePath, bytes, {
        contentType: file.type,
        duplex: 'half'
      } as any);

    if (uploadError) {
      console.error('Failed to upload file to Supabase storage:', uploadError);
      return NextResponse.json({ detail: `Failed to save file to cloud storage: ${uploadError.message}` }, { status: 500 });
    }

    // Create report record in database
    const { error: dbError } = await supabaseServer
      .from('reports')
      .insert({
        id: reportId,
        user_id: user.id,
        file_name: originalName,
        file_path: storagePath,
        file_type: file.type,
        file_size: bytes.byteLength,
        upload_status: 'PENDING',
        status_message: 'Report uploaded and queued for analysis.'
      });

    if (dbError) {
      console.error('Database insert failed for report:', dbError);
      // Attempt storage cleanup
      await supabaseServer.storage.from('reports').remove([storagePath]);
      return NextResponse.json({ detail: `Database insert failed: ${dbError.message}` }, { status: 500 });
    }

    // Log the audit event
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await supabaseServer
      .from('audit_logs')
      .insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        action: 'REPORT_UPLOAD',
        table_name: 'reports',
        record_id: reportId,
        ip_address: ip,
        details: `Uploaded file: ${originalName}`
      });

    return NextResponse.json(
      { report_id: reportId, status: 'PENDING', message: 'Report uploaded and queued for analysis.' },
      { status: 202 }
    );
  } catch (error: any) {
    console.error('Upload handler error:', error);
    return NextResponse.json({ detail: error.message || 'Internal server error' }, { status: 500 });
  }
}
