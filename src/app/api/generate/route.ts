import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt, tone = 'calm', fileContext = '' } = await req.json();

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  const contextSummary = fileContext
    ? `Here is some background context from uploaded files. Use it only if it's relevant:\n\n${fileContext.slice(
        0,
        4000
      )}`
    : '';

  const systemPrompt = `You are a respectful and helpful assistant helping a parent answer a court question related to custody. Respond in a "${tone}" tone. Be clear, empathetic, and respectful.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `${contextSummary}\n\nNow answer this court question:\n\n${prompt}` },
  ];

  const body = {
    model: 'gpt-4o',
    messages,
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