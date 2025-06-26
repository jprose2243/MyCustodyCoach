import { extractPdfText } from './extractPdfText';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';

const MAX_CHARS = 10000;

/**
 * Extracts plain text from a file based on MIME type.
 * Supports: PDF, DOCX, TXT, PNG, JPG.
 */
export async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    return await extractPdfText(buffer);
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const { value } = await mammoth.extractRawText({ buffer });
      console.log('✅ DOCX text extracted');
      return value.trim().slice(0, MAX_CHARS);
    } catch (err) {
      console.warn('⚠️ DOCX parsing failed:', err);
      return '';
    }
  }

  if (mimeType === 'text/plain') {
    console.log('✅ Plaintext file extracted');
    return buffer.toString('utf-8').trim().slice(0, MAX_CHARS);
  }

  if (mimeType.startsWith('image/')) {
    return await extractTextFromImage(buffer);
  }

  console.warn('❌ Unsupported MIME type:', mimeType);
  return '';
}

/**
 * OCR fallback for scanned images (PNG, JPG).
 */
async function extractTextFromImage(buffer: Buffer): Promise<string> {
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