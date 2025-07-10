import { extractPdfText } from '../lib/server-only/pdf-processor';
import { createAppError, ErrorCode, logError } from './errorHandler';

const MAX_TEXT_LENGTH = 50000;
const MAX_TXT_FILE_SIZE = 10 * 1024 * 1024; // 10MB for text files

/**
 * Extracts text from various file types
 */
export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  try {
    if (!buffer || buffer.length === 0) {
      throw createAppError(
        'Invalid file buffer - buffer is empty',
        ErrorCode.FILE_PROCESSING_ERROR,
        400
      );
    }

    let extractedText = '';

    switch (mimeType) {
      case 'application/pdf':
        extractedText = await extractTextFromPdf(buffer);
        break;

      case 'text/plain':
        extractedText = extractTextFromPlainText(buffer);
        break;

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        extractedText = await extractTextFromDocx(buffer);
        break;

      case 'image/png':
      case 'image/jpeg':
      case 'image/jpg':
      case 'image/webp':
        extractedText = await extractTextFromImage(buffer, mimeType);
        break;

      default:
        throw createAppError(
          `Unsupported file type: ${mimeType}`,
          ErrorCode.UNSUPPORTED_FILE_TYPE,
          415
        );
    }

    // Sanitize and truncate text
    extractedText = sanitizeExtractedText(extractedText);
    
    if (extractedText.length > MAX_TEXT_LENGTH) {
      extractedText = extractedText.slice(0, MAX_TEXT_LENGTH) + '\n\n...[content truncated]';
    }

    return extractedText || 'No text content could be extracted from this file.';

  } catch (error) {
    logError(error as Error, {
      mimeType,
      bufferSize: buffer?.length,
      operation: 'TEXT_EXTRACTION',
    });

    // Re-throw known application errors
    if (error instanceof Error && 'code' in error) {
      throw error;
    }

    // Wrap unexpected errors
    throw createAppError(
      `Failed to extract text from file: ${(error as Error).message}`,
      ErrorCode.FILE_PROCESSING_ERROR,
      500,
      { mimeType, originalError: (error as Error).message }
    );
  }
}

/**
 * Extracts text from PDF files using the robust PDF processor
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    return await extractPdfText(buffer);
  } catch (error) {
    // The PDF processor already handles its own errors appropriately
    throw error;
  }
}

/**
 * Extracts text from plain text files
 */
function extractTextFromPlainText(buffer: Buffer): string {
  try {
    if (buffer.length > MAX_TXT_FILE_SIZE) {
      throw createAppError(
        `Text file too large. Maximum size is ${MAX_TXT_FILE_SIZE / (1024 * 1024)}MB`,
        ErrorCode.FILE_TOO_LARGE,
        413
      );
    }

    // Try UTF-8 first, fall back to latin1 if needed
    let text = '';
    try {
      text = buffer.toString('utf8');
      // Check for invalid UTF-8 sequences
      if (text.includes('\uFFFD')) {
        throw new Error('Invalid UTF-8');
      }
    } catch {
      // Fall back to latin1 encoding
      text = buffer.toString('latin1');
    }

    return text.trim();
  } catch (error) {
    throw createAppError(
      'Failed to read text file. The file may be corrupted or use an unsupported encoding.',
      ErrorCode.FILE_PROCESSING_ERROR,
      400,
      { originalError: (error as Error).message }
    );
  }
}

/**
 * Extracts text from DOCX files
 * Note: This is a simplified implementation. In production, consider using a library like mammoth
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function extractTextFromDocx(_buffer: Buffer): Promise<string> {
  try {
    // For now, return a helpful message
    // TODO: Implement proper DOCX parsing using mammoth or similar library
    return 'DOCX file detected. For best results, please convert your document to PDF or plain text format. DOCX text extraction will be enhanced in a future update.';
  } catch (error) {
    throw createAppError(
      'DOCX processing failed. Please convert your document to PDF or plain text format.',
      ErrorCode.FILE_PROCESSING_ERROR,
      400,
      { originalError: (error as Error).message }
    );
  }
}

/**
 * Extracts text from image files using OCR
 * Note: This is a placeholder. In production, integrate with Tesseract.js or cloud OCR service
 */
async function extractTextFromImage(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    // TODO: Implement OCR using Tesseract.js or cloud service (Google Vision, AWS Textract)
    // For now, return a helpful message
    return `Image file (${mimeType}) detected. OCR text extraction is currently being improved. For immediate results, please convert your image to text or PDF format.`;
  } catch (error) {
    throw createAppError(
      'Image text extraction failed. Please convert your image to text or PDF format.',
      ErrorCode.FILE_PROCESSING_ERROR,
      400,
      { mimeType, originalError: (error as Error).message }
    );
  }
}

/**
 * Sanitizes extracted text to remove potentially harmful content
 */
function sanitizeExtractedText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    // Remove null bytes and other control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove excessive line breaks
    .replace(/\n{3,}/g, '\n\n')
    // Trim whitespace
    .trim();
}

/**
 * Validates file type by checking magic bytes (file signatures)
 */
export function validateFileType(buffer: Buffer, expectedMimeType: string): boolean {
  if (!buffer || buffer.length < 4) {
    return false;
  }

  const bytes = Array.from(buffer.slice(0, 16));

  switch (expectedMimeType) {
    case 'application/pdf':
      return buffer.slice(0, 4).toString() === '%PDF';

    case 'image/png':
      const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
      return pngSignature.every((byte, index) => bytes[index] === byte);

    case 'image/jpeg':
    case 'image/jpg':
      return bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;

    case 'image/webp':
      return buffer.slice(0, 4).toString() === 'RIFF' && 
             buffer.slice(8, 12).toString() === 'WEBP';

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      // DOCX files are ZIP archives, check for ZIP signature
      const zipSigs = [
        [0x50, 0x4B, 0x03, 0x04],
        [0x50, 0x4B, 0x05, 0x06],
        [0x50, 0x4B, 0x07, 0x08]
      ];
      return zipSigs.some(sig => sig.every((byte, index) => bytes[index] === byte));

    case 'text/plain':
      // For text files, just check that it's not obviously binary
      const sample = buffer.slice(0, Math.min(buffer.length, 100)).toString('utf8');
      // Simple heuristic: if more than 30% of characters are non-printable, it's probably binary
      const nonPrintableCount = (sample.match(/[\x00-\x08\x0E-\x1F\x7F-\x9F]/g) || []).length;
      return nonPrintableCount / sample.length < 0.3;

    default:
      return true; // Unknown types pass validation
  }
}