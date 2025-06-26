import { extractPdfText } from './extractPdfText';
import mammoth from 'mammoth';

const MAX_CHARS = 10000;

function truncate(text: string): string {
  return text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) + '\n\n...[truncated]' : text;
}

/**
 * Extracts plain text from various file types based on MIME type.
 * Supports: PDF, DOCX, TXT, PNG, JPEG.
 */
export async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    try {
      const text = await extractPdfText(buffer);
      return truncate(text);
    } catch (err) {
      console.error('❌ PDF extraction failed:', err);
      return '';
    }
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const { value } = await mammoth.extractRawText({ buffer });
      console.log('✅ DOCX text extracted');
      return truncate(value.trim());
    } catch (err) {
      console.warn('⚠️ DOCX parsing failed:', err);
      return '';
    }
  }

  if (mimeType === 'text/plain') {
    console.log('✅ Plaintext file extracted');
    return truncate(buffer.toString('utf-8').trim());
  }

  if (mimeType.startsWith('image/')) {
    let worker: any;
    try {
      const { createWorker } = await import('tesseract.js');
      worker = await (createWorker as any)({
        logger: (m: any) => console.log('🧠 OCR progress:', m),
      });

      await worker.load();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');

      const { data } = await worker.recognize(buffer);
      console.log('✅ Image OCR complete');
      return truncate(data.text.trim());
    } catch (err) {
      console.error('❌ OCR failed:', err);
      return '';
    } finally {
      if (worker) await worker.terminate();
    }
  }

  console.warn('❌ Unsupported MIME type:', mimeType);
  return '';
}