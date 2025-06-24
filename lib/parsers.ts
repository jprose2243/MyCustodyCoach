import mammoth from 'mammoth';
import { PDFDocument } from 'pdf-lib';

export async function parseFileContent(buffer: Buffer, mimetype: string): Promise<string> {
  if (mimetype === 'application/pdf') {
    const pdfDoc = await PDFDocument.load(buffer);
    const pages = pdfDoc.getPages();
    let text = '';

    for (const page of pages) {
      const content = (page as any).getTextContent?.(); // may be undefined
      if (content) text += content as string;
    }

    return text || '[No text extracted from PDF]';
  }

  if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '[No text found in DOCX]';
  }

  return '[Unsupported file type]';
}