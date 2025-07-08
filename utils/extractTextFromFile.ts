import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';

const MAX_CHARS = 10000;

function truncate(text: string): string {
  return text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) + '\n\n...[truncated]' : text;
}

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  try {
    if (mimeType === 'application/pdf') {
      // 🧠 Dynamically import PDF parser (avoids build-time 'canvas' dependency)
      const { extractPdfText } = await import('@/lib/server-only/pdf-extract');
      return await extractPdfText(buffer);
    }

    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const { value }: { value: string } = await mammoth.extractRawText({ buffer });
      return truncate(value.trim());
    }

    if (mimeType === 'text/plain') {
      return truncate(buffer.toString('utf-8').trim());
    }

    if (mimeType.startsWith('image/')) {
      const { data }: { data: { text: string } } = await Tesseract.recognize(buffer, 'eng');
      return truncate(data.text.trim());
    }

    throw new Error(`Unsupported file type: ${mimeType}`);
  } catch (err) {
    console.error('❌ extractTextFromFile error:', err);
    return '';
  }
}