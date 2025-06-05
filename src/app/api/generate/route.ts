import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file || !file.name.endsWith('.docx')) {
    return NextResponse.json({ error: 'Only .docx files are supported' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    const result = await mammoth.extractRawText({ buffer });
    return NextResponse.json({ text: result.value });
  } catch (err) {
    console.error('Mammoth error:', err);
    return NextResponse.json({ error: 'Failed to process .docx file' }, { status: 500 });
  }
}