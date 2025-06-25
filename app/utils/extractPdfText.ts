import { getDocument } from 'pdfjs-dist/legacy/build/pdf.js';
import { createWorker } from 'tesseract.js';
import { createCanvas } from 'canvas';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

/**
 * Extracts text from a PDF buffer.
 * Uses pdfjs first, falls back to OCR if needed.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
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

    if (fullText.trim().length > 100) {
      console.log('✅ Extracted using pdfjs-dist');
      return fullText;
    }

    throw new Error('Low confidence content, triggering OCR fallback');
  } catch (err) {
    console.warn('⚠️ PDF.js failed, using OCR fallback...', err);
    return await extractWithOCR(buffer);
  }
}

/**
 * OCR fallback using Tesseract.js
 */
async function extractWithOCR(buffer: Buffer): Promise<string> {
  const worker = await createWorker({
    logger: (m: any) => console.log('🧠 OCR:', m),
  } as any); // Type workaround

  try {
    await (worker as any).load();
    await (worker as any).loadLanguage('eng');
    await (worker as any).initialize('eng');

    const { data } = await worker.recognize(buffer);
    console.log('🧠 OCR fallback succeeded');
    return data.text;
  } catch (e) {
    console.error('❌ OCR error:', e);
    return '';
  } finally {
    await worker.terminate();
  }
}