import { NextRequest, NextResponse } from 'next/server';
import { extractPdfText } from '@/app/utils/extractPdfText';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const question = (formData.get('question') as string || '').trim();
    const tone = ((formData.get('tone') as string) || 'calm').trim().toLowerCase();

    let contextText = '';
    const file = formData.get('contextFile') as File | null;
    if (file && typeof file.arrayBuffer === 'function') {
      const buffer = Buffer.from(await file.arrayBuffer());
      contextText = await extractPdfText(buffer);
    }

    const fullPrompt = `
You are a helpful legal assistant working for MyCustodyCoach.

Respond in a "${tone}" tone.

The user has asked:
"${question}"

${contextText ? `---\nContext from uploaded PDF:\n${contextText}` : ''}
    `.trim();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are a calm, empathetic legal assistant who helps parents understand custody laws. Provide helpful, clear, non-legal guidance. Never provide legal advice.',
        },
        { role: 'user', content: fullPrompt },
      ],
      temperature: 0.7,
    });

    const answer = completion.choices[0]?.message?.content || 'No response returned.';
    return NextResponse.json({ result: answer });
  } catch (error: any) {
    console.error('generate-response error:', error);
    return NextResponse.json({ error: 'Failed to generate AI response.' }, { status: 500 });
  }
}
