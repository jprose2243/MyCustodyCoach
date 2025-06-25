import { getDocument } from 'pdfjs-dist/legacy/build/pdf.js';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import mammoth from 'mammoth';

export async function parseFileContent(buffer: Buffer, mimetype: string): Promise<string> {
  if (mimetype === 'application/pdf') {
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

      return fullText.trim() || '[No text extracted from PDF]';
    } catch (err) {
      console.error('❌ Failed to extract text from PDF:', err);
      return '[Failed to extract PDF text]';
    }
  }

  if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value?.trim() || '[No text found in DOCX]';
    } catch (err) {
      console.error('❌ Failed to parse DOCX:', err);
      return '[Failed to extract DOCX text]';
    }
  }

  return '[Unsupported file type]';
}