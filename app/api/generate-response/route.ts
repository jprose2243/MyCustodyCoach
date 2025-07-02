import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import type { IncomingMessage } from 'http';
import formidable from 'formidable';
import * as fs from 'fs/promises';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase-admin';
import { extractTextFromFile } from '@/utils/extractTextFromFile';

export const config = {
  api: { bodyParser: false },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const MAX_FILE_SIZE_MB = 500;
const MAX_CONTEXT_CHARS = 10000;

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/png',
  'image/jpeg',
];

async function parseFormDataFromNextRequest(req: NextRequest): Promise<{ fields: Record<string, any> }> {
  const contentType = req.headers.get('content-type') || '';
  const contentLength = req.headers.get('content-length') || '';
  const blob = await req.blob();
  const bodyBuffer = Buffer.from(await blob.arrayBuffer());

  const mockReq = Object.assign(Readable.from(bodyBuffer), {
    headers: {
      'content-type': contentType,
      'content-length': contentLength,
    },
  }) as unknown as IncomingMessage;

  const form = formidable({
    maxFileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    allowEmptyFiles: false,
    multiples: false,
  });

  return new Promise((resolve, reject) => {
    form.parse(mockReq, (err, fields) => {
      if (err) {
        console.error('❌ Form parsing error:', err);
        return reject(err);
      }
      resolve({ fields });
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const { fields } = await parseFormDataFromNextRequest(req);

    const question = (fields.question || '').trim();
    const tone = (fields.tone || 'calm').trim().toLowerCase();
    const fileUrl = (fields.fileUrl || '').trim();
    const userId = (fields.userId || '').trim();

    if (!userId) {
      return NextResponse.json({ error: '❌ Missing userId. Must be authenticated.' }, { status: 401 });
    }

    if (!question) {
      return NextResponse.json({ error: '❌ Question is required.' }, { status: 400 });
    }

    // ✅ Check user profile first
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('questions_used, subscribed')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: '❌ Failed to fetch user profile.' }, { status: 403 });
    }

    const { questions_used, subscribed } = userProfile;

    if (!subscribed && questions_used >= 3) {
      return NextResponse.json({
        error: '❌ Free question limit reached. Please subscribe to continue.',
      }, { status: 403 });
    }

    console.log('📝 User prompt:', question);
    console.log('🌐 File URL:', fileUrl || 'None');

    let context = '';
    let fileName = '';

    if (fileUrl) {
      const parts = fileUrl.split('/object/public/');
      if (parts.length < 2) {
        return NextResponse.json({ error: '❌ Invalid file URL format.' }, { status: 400 });
      }

      const [bucketName, ...pathParts] = parts[1].split('/');
      const filePath = pathParts.join('/');
      fileName = decodeURIComponent(pathParts.at(-1) || '');

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 60);

      if (signedUrlError || !signedUrlData?.signedUrl) {
        console.error('❌ Signed URL fetch error:', signedUrlError);
        return NextResponse.json({ error: '❌ Could not generate signed file URL.' }, { status: 500 });
      }

      const fileRes = await fetch(signedUrlData.signedUrl);
      const fileBuffer = Buffer.from(await fileRes.arrayBuffer());
      const mimeType = fileRes.headers.get('content-type') || 'application/octet-stream';

      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        return NextResponse.json({ error: '❌ Unsupported file type.' }, { status: 415 });
      }

      context = await extractTextFromFile(fileBuffer, mimeType);
      if (context.length > MAX_CONTEXT_CHARS) {
        context = context.slice(0, MAX_CONTEXT_CHARS) + '\n\n...[truncated]';
      }

      console.log('📄 Extracted context length:', context.length);
    }

    const aiPrompt = `
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
          content: 'You are a calm, empathetic assistant helping parents understand custody paperwork. Never provide legal advice.',
        },
        {
          role: 'user',
          content: aiPrompt,
        },
      ],
    });

    const result = completion.choices[0]?.message?.content?.trim() || 'No response generated.';
    console.log('✅ AI response:', result.slice(0, 100));

    // ✅ Log session
    const { error: insertError } = await supabase.from('sessions').insert([
      {
        user_id: userId,
        question,
        tone,
        file_name: fileName || null,
        file_url: fileUrl || null,
        response: result,
      },
    ]);

    if (insertError) {
      console.warn('⚠️ Failed to insert session log:', insertError.message);
    }

    // ✅ Increment questions_used if not subscribed
    if (!subscribed) {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ questions_used: questions_used + 1 })
        .eq('id', userId);

      if (updateError) {
        console.warn('⚠️ Failed to increment question count:', updateError.message);
      }
    }

    return NextResponse.json({ result });
  } catch (err: any) {
    console.error('❌ Internal server error in /generate-response:', err);
    return NextResponse.json(
      { error: err.message || 'Unexpected error occurred.' },
      { status: 500 }
    );
  }
}