import mammoth from 'mammoth';
import { extractPdfText } from '../app/utils/extractPdfText';

export async function parseFileContent(buffer: Buffer, mimetype: string): Promise<string> {
  if (mimetype === 'application/pdf') {
    try {
      const text = await extractPdfText(buffer);
      return text || '[No text extracted from PDF]';
    } catch (err: any) {
      console.error('PDF extraction failed:', err);
      return `[PDF extraction failed: ${err?.message || err}]`;
    }
  }

  if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '[No text found in DOCX]';
  }

  return '[Unsupported file type]';
}
