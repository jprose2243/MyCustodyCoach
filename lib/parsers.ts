import mammoth from 'mammoth';
import { extractPdfText } from '@/app/utils/extractPdfText';

export async function parseFileContent(buffer: Buffer, mimetype: string): Promise<string> {
  if (mimetype === 'application/pdf') {
    return await extractPdfText(buffer);
  }

  if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '[No text found in DOCX]';
  }

  return '[Unsupported file type]';
}