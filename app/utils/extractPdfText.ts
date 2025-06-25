import { getDocument } from 'pdfjs-dist/legacy/build/pdf.js';
import { createWorker } from 'tesseract.js';
import { createCanvas } from 'canvas';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

/**
 * Extracts text from a PDF buffer.
 * Tries native pdfjs-dist parsing, then falls back to OCR via Tesseract.js.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const uint8Array = new Uint8Array(buffer);
    const loadingTask = getDocument({ data: uint8Array });
    const pdf: PDFDocumentProxy = await loadingTask.promise;

    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ');
      fullText += `\n${pageText}`;
    }

    if (fullText.trim().length > 100) {
      console.log("✅ Extracted using pdfjs-dist");
      return fullText;
    }

    throw new Error('Insufficient text extracted. Falling back to OCR...');
  } catch (err) {
    console.warn("⚠️ PDF.js failed, trying OCR fallback...", err);
    return await extractWithOCR(buffer);
  }
}

/**
 * Fallback OCR if pdfjs can't extract text (e.g. scanned document)
 */
async function extractWithOCR(buffer: Buffer): Promise<string> {
  const worker = await createWorker('eng');

  let ocrText = '';

  try {
    const uint8Array = new Uint8Array(buffer);
    const pdf = await getDocument({ data: uint8Array }).promise;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2 });

      const canvas = createCanvas(viewport.width, viewport.height);
      const ctx = canvas.getContext('2d') as any;
      await page.render({ canvasContext: ctx, viewport }).promise;

      const imageBuffer = canvas.toBuffer('image/png');
      const { data } = await worker.recognize(imageBuffer);
      ocrText += `\n${data.text}`;
    }

    console.log("🧠 OCR fallback succeeded");
    return ocrText;
  } catch (e) {
    console.error("❌ OCR failed:", e);
    return '';
  } finally {
    await worker.terminate();
  }
}