import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt, tone = 'calm' } = await req.json();

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  const systemPrompt = `You are a respectful and helpful assistant helping a parent answer a court question related to custody. Respond in a "${tone}" tone. Be clear, empathetic, and respectful.`;

  const body = {
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.6,
  };

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const json = await openaiRes.json();

    if (!openaiRes.ok) {
      return NextResponse.json({ error: json.error?.message || 'OpenAI error' }, { status: 500 });
    }

    return NextResponse.json({ result: json.choices[0]?.message?.content });
  } catch (error) {
    return NextResponse.json({ error: 'Server error while generating response.' }, { status: 500 });
  }
}
