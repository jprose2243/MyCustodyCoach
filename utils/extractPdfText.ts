import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

// Set the path to the worker for server-side environments
GlobalWorkerOptions.workerSrc = require('pdfjs-dist/build/pdf.worker.min.js');

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
      console.log('✅ Text extracted with pdfjs-dist');
      return fullText.trim();
    }

    throw new Error('PDF too sparse — falling back to OCR');
  } catch (err) {
    console.warn('⚠️ PDF.js failed, falling back to OCR:', err);
    return await extractWithOCR(buffer);
  }
}

async function extractWithOCR(buffer: Buffer): Promise<string> {
  const worker = await (createWorker as any)({
    logger: (m: any) => console.log('🧠 OCR:', m),
  });

  try {
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    const { data } = await worker.recognize(buffer);
    return data.text.trim();
  } catch (err) {
    console.error('❌ OCR failed:', err);
    return '';
  } finally {
    await worker.terminate();
  }
}