import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt, tone = 'calm', fileContext = '' } = await req.json();

  if (!prompt || !prompt.trim()) {
    return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
  }

  const cleanContext = fileContext.slice(0, 3000);
  const contextSummary = cleanContext
    ? `Here is some background context from uploaded files. Use it only if relevant:\n\n${cleanContext}`
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
        Authorization: `Bearer ${process.env.OPENAI_API_KEY || ''}`,
      },
      body: JSON.stringify(body),
    });

    let json;
    try {
      json = await openaiRes.json();
    } catch (e) {
      console.error('🛑 Failed to parse JSON from OpenAI:', e);
      return NextResponse.json(
        { error: 'Invalid response from OpenAI. Could not parse JSON.' },
        { status: 502 }
      );
    }

    console.log('🔍 Raw OpenAI Response:', JSON.stringify(json, null, 2));

    const result = json.choices?.[0]?.message?.content;

    if (!result || result.length < 10) {
      return NextResponse.json(
        { error: 'OpenAI returned an empty or invalid response.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('🚨 AI route error:', error);
    return NextResponse.json(
      { error: 'Server error while generating response.' },
      { status: 500 }
    );
  }
}