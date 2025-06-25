import { NextRequest, NextResponse } from 'next/server';
import formidable from 'formidable';
import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import OpenAI from 'openai';
import * as Tesseract from 'tesseract.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: false });

    // Cast NextRequest to IncomingMessage for formidable compatibility
    form.parse((req as any).req, async (err, fields, files) => {
      if (err) return reject(NextResponse.json({ error: 'File parse error' }, { status: 400 }));

      const question = fields.question?.[0] || '';
      const tone = fields.tone?.[0] || 'calm';
      const uploadedFile = files.contextFile?.[0];

      let extractedText = '';

      try {
        if (uploadedFile) {
          const filePath = uploadedFile.filepath;
          const mime = uploadedFile.mimetype;

          if (mime === 'application/pdf') {
            const data = new Uint8Array(fs.readFileSync(filePath));
            const loadingTask = pdfjsLib.getDocument({ data });
            const pdfDoc = await loadingTask.promise;
            for (let i = 1; i <= pdfDoc.numPages; i++) {
              const page = await pdfDoc.getPage(i);
              const content = await page.getTextContent();
              const pageText = content.items.map((item: any) => item.str).join(' ');
              extractedText += pageText + '\n';
            }
          } else if (
            mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ) {
            const data = fs.readFileSync(filePath);
            const result = await mammoth.extractRawText({ buffer: data });
            extractedText = result.value;
          } else if (mime?.startsWith('image/')) {
            const result = await Tesseract.recognize(filePath, 'eng');
            extractedText = result.data.text;
          } else if (mime === 'text/plain') {
            extractedText = fs.readFileSync(filePath, 'utf8');
          } else {
            return resolve(
              NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
            );
          }
        }

        const prompt = `A user asked: "${question}". Use a ${tone} tone. Base your answer on the following uploaded material if applicable:\n\n${extractedText}`;

        const aiResponse = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a legal language coach for parents in custody court. Be clear, neutral, and helpful. Do not give legal advice.'
            },
            {
              role: 'user',
              content: prompt
            },
          ],
        });

        const result = aiResponse.choices[0].message?.content || '';
        resolve(NextResponse.json({ result }, { status: 200 }));
      } catch (err: any) {
        console.error('Processing error:', err);
        reject(NextResponse.json({ error: 'Processing failed' }, { status: 500 }));
      }
    });
  });
}
