import mammoth from 'mammoth';
import { PDFDocument } from 'pdf-lib';

export async function parseFileContent(buffer: Buffer, mimetype: string): Promise<string> {
  if (mimetype === 'application/pdf') {
    const pdfDoc = await PDFDocument.load(buffer);
    const pages = pdfDoc.getPages();
    let text = '';

    for (const page of pages) {
      const content = page.getTextContent?.(); // may be undefined in some builds
      if (content) text += content;
    }

    return text || '[No text extracted from PDF]';
  }

  if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '[No text found in DOCX]';
  }

  return '[Unsupported file type]';
}