import { extractPdfText } from './extractPdfText';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';

const MAX_CHARS = 10000;

/**
 * Extracts plain text from any uploaded file based on its MIME type.
 */
export async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    switch (mimeType) {
      case 'application/pdf':
        return await extractPdfText(buffer);

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
        const { value } = await mammoth.extractRawText({ buffer });
        console.log('✅ DOCX text extracted');
        return value.trim().slice(0, MAX_CHARS);
      }

      case 'text/plain':
        console.log('✅ Plaintext file extracted');
        return buffer.toString('utf-8').trim().slice(0, MAX_CHARS);

      default:
        if (mimeType.startsWith('image/')) {
          return await extractWithOCR(buffer);
        }

        console.warn('❌ Unsupported MIME type:', mimeType);
        return '';
    }
  } catch (err) {
    console.error(`❌ extractTextFromFile failed for type "${mimeType}"`, err);
    return '';
  }
}

/**
 * OCR fallback using tesseract.js for image files.
 */
async function extractWithOCR(buffer: Buffer): Promise<string> {
  try {
    console.log('🔁 OCR fallback triggered');
    const { data } = await Tesseract.recognize(buffer, 'eng', {
      logger: (m) => console.log('🧠 OCR:', m),
    });

    const extracted = data.text.trim();
    if (!extracted) {
      console.warn('⚠️ OCR returned empty text');
      return '';
    }

    console.log('✅ OCR extraction complete');
    return extracted.slice(0, MAX_CHARS);
  } catch (err) {
    console.error('❌ OCR failed:', err);
    return '';
  }
}