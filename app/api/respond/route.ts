import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions'; // ✅ updated import path
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { question, tone } = await req.json();
    if (!question || !tone) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { files: true },
    });

    const fileContext = user?.files?.map(file => file.content).join('\n\n').slice(0, 4000) || '';
    const systemPrompt = `You are an AI assistant trained to help parents in family court. Respond in a "${tone}" tone. Use uploaded legal documents for context when helpful.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Uploaded Context:\n${fileContext}\n\nQuestion:\n${question}` }
    ];

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages,
        temperature: 0.7
      })
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      console.error('OpenAI error:', data);
      return NextResponse.json({ error: data.error?.message || 'OpenAI request failed' }, { status: 500 });
    }

    const answer = data?.choices?.[0]?.message?.content || '[No response received]';
    return NextResponse.json({ answer });

  } catch (err) {
    console.error('Respond API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}