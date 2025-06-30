import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.js';
import Tesseract from 'tesseract.js';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

const MAX_CHARS = 10000;

// ✅ Vercel-compatible worker setup
GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.js';

function truncate(text: string): string {
  return text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) + '\n\n...[truncated]' : text;
}

/**
 * Extracts text from a PDF using pdfjs-dist. Falls back to OCR if sparse or fails.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    console.log('📥 extractPdfText called');
    const uint8Array = new Uint8Array(buffer);
    const loadingTask = getDocument({ data: uint8Array });
    const pdf: PDFDocumentProxy = await loadingTask.promise;

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ');
      fullText += `\n${pageText}`;
    }

    fullText = fullText.trim();

    if (fullText.length < 100) {
      console.warn('⚠️ PDF sparse — using OCR fallback');
      return await extractWithOCR(buffer);
    }

    console.log('✅ Text extracted with pdfjs-dist');
    return truncate(fullText);
  } catch (err) {
    console.warn('⚠️ PDF.js failed, falling back to OCR:', err);
    return await extractWithOCR(buffer);
  }
}

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
    return truncate(extracted);
  } catch (err) {
    console.error('❌ OCR failed:', err);
    return '';
  }
}