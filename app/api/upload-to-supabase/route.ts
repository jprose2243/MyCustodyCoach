import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import formidable from 'formidable';
import { IncomingMessage } from 'http';
import * as fs from 'fs/promises';

// Disable body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

// Supabase client setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 🔐 server-side only
);

const BUCKET_NAME = 'user-uploads';
const MAX_SIZE_MB = 500;

async function parseMultipart(
  req: NextRequest
): Promise<{ file: formidable.File; userId: string }> {
  const contentType = req.headers.get('content-type') || '';
  const contentLength = req.headers.get('content-length') || '';
  const blob = await req.blob();
  const buffer = Buffer.from(await blob.arrayBuffer());

  const stream = Readable.from(buffer);
  const mockReq = Object.assign(stream, {
    headers: {
      'content-type': contentType,
      'content-length': contentLength,
    },
  }) as unknown as IncomingMessage;

  const form = formidable({
    maxFileSize: MAX_SIZE_MB * 1024 * 1024,
    allowEmptyFiles: false,
    multiples: false,
  });

  return new Promise((resolve, reject) => {
    form.parse(mockReq, (err, fields, files) => {
      if (err || !files?.file?.[0] || !fields?.userId?.[0]) {
        console.warn('❌ Form error or missing fields:', err, fields, files);
        return reject(new Error('❌ Invalid upload: file and userId required.'));
      }
      resolve({
        file: files.file[0],
        userId: fields.userId[0],
      });
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const { file, userId } = await parseMultipart(req);
    const buffer = await fs.readFile(file.filepath);

    const filePath = `${userId}/${Date.now()}-${file.originalFilename}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.mimetype || 'application/octet-stream',
        upsert: false,
      });

    if (error) throw error;

    const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;

    return NextResponse.json({ success: true, path: filePath, url: fileUrl });
  } catch (err: any) {
    console.error('❌ Upload error:', err);
    return NextResponse.json(
      { error: err.message || 'Upload failed' },
      { status: 500 }
    );
  }
}