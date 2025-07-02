import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import { IncomingMessage } from 'http';
import formidable from 'formidable';
import * as fs from 'fs/promises';
import path from 'path';
import { supabase } from '@/lib/supabase-admin'; // ✅ secure server-only admin client

export const config = {
  api: {
    bodyParser: false,
  },
};

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
      const file = files?.file;
      const userId = fields?.userId;
      if (err || !file || !userId) {
        console.warn('❌ Form error or missing fields:', err, fields, files);
        return reject(new Error('❌ Invalid upload: file and userId required.'));
      }
      resolve({
        file: Array.isArray(file) ? file[0] : file,
        userId: Array.isArray(userId) ? userId[0] : userId,
      });
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const { file, userId } = await parseMultipart(req);
    const buffer = await fs.readFile(file.filepath);

    const sanitizedName = path
      .basename(file.originalFilename || 'upload.bin')
      .replace(/\s+/g, '-');

    const filePath = `${userId}/${Date.now()}-${sanitizedName}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.mimetype || 'application/octet-stream',
        upsert: false,
      });

    if (error) {
      console.error('❌ Supabase upload error:', error.message);
      throw error;
    }

    const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;

    return NextResponse.json({
      success: true,
      path: filePath,
      url: encodeURI(fileUrl),
    });
  } catch (err: any) {
    console.error('❌ Upload handler error:', err.message || err);
    return NextResponse.json(
      { error: err.message || 'Upload failed' },
      { status: 500 }
    );
  }
}