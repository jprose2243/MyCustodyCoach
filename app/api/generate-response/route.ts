import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import formidable, { File } from 'formidable';
import fs from 'fs';
import OpenAI from 'openai';
import { extractPdfText } from '@/utils/extractPdfText';

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/png',
  'image/jpeg',
];

/**
 * Parses a NextRequest into fields and files using formidable
 */
async function parseFormDataFromNextRequest(req: NextRequest): Promise<{ fields: any; files: any }> {
  const contentType = req.headers.get('content-type') || '';
  const contentLength = req.headers.get('content-length') || '';

  const blob = await req.blob();
  const bodyBuffer = Buffer.from(await blob.arrayBuffer());

  const mockReq: Partial<IncomingMessage> = Readable.from(bodyBuffer);
  mockReq.headers = {
    'content-type': contentType,
    'content-length': contentLength,
  };

  const form = formidable({
    maxFileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    keepExtensions: true,
  });

  return new Promise((resolve, reject) => {
    form.parse(mockReq as any, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const { fields, files } = await parseFormDataFromNextRequest(req);

    const question = (fields?.question?.[0] || '').trim();
    const tone = (fields?.tone?.[0] || 'calm').trim().toLowerCase();
    const file = files?.contextFile?.[0] as File | undefined;

    if (!question) {
      return NextResponse.json({ error: '❌ Question is required.' }, { status: 400 });
    }

    let context = '';
    if (file) {
      const type = file.mimetype || '';
      if (!ALLOWED_MIME_TYPES.includes(type)) {
        return NextResponse.json({ error: '❌ Unsupported file type.' }, { status: 415 });
      }

      const buffer = fs.readFileSync(file.filepath);
      context = await extractPdfText(buffer);
    }

    const prompt = `
You are a calm, professional legal assistant working for MyCustodyCoach.
The user asked: "${question}"
Tone: "${tone}"

${context ? `Context from uploaded file:\n${context}` : ''}
    `.trim();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content:
            'You are a calm, empathetic assistant helping parents understand custody paperwork. Never provide legal advice.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const result = completion.choices[0]?.message?.content || 'No response generated.';
    return NextResponse.json({ result });
  } catch (err: any) {
    console.error('❌ Error in /api/test:', err);
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}