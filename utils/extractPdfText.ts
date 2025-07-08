import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.js';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import Tesseract from 'tesseract.js';

const MAX_CHARS = 10000;

// ✅ Safe for Node.js environment
if (typeof window === 'undefined') {
  // Prevent PDF.js from requiring browser APIs
  // @ts-ignore
  globalThis.navigator = { userAgent: 'node.js' };
  // @ts-ignore
  globalThis.document = {};
  // @ts-ignore
  globalThis.HTMLCanvasElement = function () {};
  GlobalWorkerOptions.workerSrc = ''; // 🛑 Disable worker for server use
}

function truncate(text: string): string {
  return text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) + '\n\n...[truncated]' : text;
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    console.log('📥 extractPdfText called');

    const loadingTask = getDocument({
      data: new Uint8Array(buffer),
      disableWorker: true,
    });

    const pdf: PDFDocumentProxy = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((item: any) => item.str).join(' ');
      fullText += `\n${text}`;
    }

    fullText = fullText.trim();

    if (fullText.length < 100) {
      console.warn('⚠️ PDF sparse — falling back to OCR');
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