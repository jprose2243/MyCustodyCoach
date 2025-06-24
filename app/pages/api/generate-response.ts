import { NextApiRequest, NextApiResponse } from 'next';
import { extractPdfText } from '../../utils/extractPdfText';
import { Configuration, OpenAIApi } from 'openai';
import formidable, { File } from 'formidable';
import fs from 'fs';

// ⛔ Required to enable formidable (multipart parsing)
export const config = {
  api: {
    bodyParser: false,
  },
};

// 🔐 OpenAI Setup
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Initialize formidable parser
  const form = new formidable.IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('❌ Form parse error:', err);
      return res.status(500).json({ error: 'Failed to parse uploaded form.' });
    }

    const question = (fields.question?.[0] || fields.question || '').toString().trim();
    const tone = (fields.tone?.[0] || fields.tone || 'calm').toString().trim().toLowerCase();

    console.log('📝 Question:', question);
    console.log('🎭 Tone:', tone);

    let contextText = '';

    // 🧠 Try extracting PDF text
    try {
      const file = (files.contextFile?.[0] || files.contextFile) as File;

      if (file?.filepath) {
        const buffer = fs.readFileSync(file.filepath);
        contextText = await extractPdfText(buffer);

        console.log('📄 PDF extracted preview:\n', contextText.slice(0, 300));
      } else {
        console.log('📭 No file uploaded.');
      }
    } catch (err) {
      console.warn('⚠️ PDF extraction failed:', err);
    }

    // 🧠 Build GPT prompt
    const fullPrompt = `
You are a helpful legal assistant working for MyCustodyCoach.

Respond in a "${tone}" tone.

The user has asked:
"${question}"

${contextText ? `---\nContext from uploaded PDF:\n${contextText}` : ''}
    `.trim();

    console.log('🧠 Prompt sent to OpenAI (preview):\n', fullPrompt.slice(0, 1500));

    // 🎯 Call OpenAI Chat
    try {
      const completion = await openai.createChatCompletion({
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

      const answer = completion.data.choices[0]?.message?.content || 'No response returned.';
      return res.status(200).json({ result: answer });
    } catch (error: any) {
      console.error('🔥 OpenAI error:', error.message || error);
      return res.status(500).json({ error: 'Failed to generate AI response.' });
    }
  });
}