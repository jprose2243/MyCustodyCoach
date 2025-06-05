import { NextResponse } from 'next/server';
import { IncomingForm } from 'formidable';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import mammoth from 'mammoth';

export const config = {
  api: {
    bodyParser: false,
  },
};

const readFile = promisify(fs.readFile);

export async function POST(req: Request) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ keepExtensions: true });

    form.parse(req as any, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing file:', err);
        return resolve(NextResponse.json({ error: 'Failed to process upload' }, { status: 500 }));
      }

      const file = files?.file?.[0];

      if (!file || file.originalFilename?.split('.').pop() !== 'docx') {
        return resolve(NextResponse.json({ error: 'Only .docx files are supported in this endpoint' }, { status: 400 }));
      }

      try {
        const buffer = await readFile(file.filepath);
        const result = await mammoth.extractRawText({ buffer });

        return resolve(NextResponse.json({ text: result.value }));
      } catch (err) {
        console.error('Error processing .docx:', err);
        return resolve(NextResponse.json({ error: 'Failed to extract text from .docx' }, { status: 500 }));
      }
    });
  });
}