import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/legacy/build/pdf';
import { createAppError, ErrorCode, logError } from '../../utils/errorHandler';

// Set the worker source for PDF.js
GlobalWorkerOptions.workerSrc = 'src/public/pdfjs/pdf.worker.min.js';

const MAX_PAGES_TO_EXTRACT = 50;
const MAX_TEXT_LENGTH = 50000;

/**
 * Extracts text from a PDF buffer
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // Validate buffer
    if (!buffer || buffer.length === 0) {
      throw createAppError(
        'Invalid PDF buffer - buffer is empty',
        ErrorCode.FILE_PROCESSING_ERROR,
        400
      );
    }

    // Basic PDF header validation
    const pdfHeader = buffer.slice(0, 5).toString();
    if (!pdfHeader.startsWith('%PDF')) {
      throw createAppError(
        'Invalid PDF file - missing PDF header',
        ErrorCode.FILE_PROCESSING_ERROR,
        400
      );
    }

    // Convert buffer to Uint8Array for PDF.js
    const uint8Array = new Uint8Array(buffer);
    
    // Load the PDF document
    const pdf = await getDocument({
      data: uint8Array,
      verbosity: 0, // Minimize console output
      stopAtErrors: true,
    }).promise;

    const totalPages = Math.min(pdf.numPages, MAX_PAGES_TO_EXTRACT);
    const textParts: string[] = [];
    let totalTextLength = 0;

    // Extract text from each page
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items from the page
        const pageText = textContent.items
          .map((item: any) => {
            // Handle different text item types
            if ('str' in item) {
              return item.str;
            }
            return '';
          })
          .join(' ')
          .trim();

        if (pageText) {
          textParts.push(pageText);
          totalTextLength += pageText.length;
          
          // Stop if we've extracted enough text
          if (totalTextLength > MAX_TEXT_LENGTH) {
            break;
          }
        }
      } catch (pageError) {
        console.warn(`Failed to extract text from page ${pageNum}:`, pageError);
        // Continue with other pages
      }
    }

    // Combine all text parts
    let extractedText = textParts.join('\n\n').trim();
    
    // Truncate if too long
    if (extractedText.length > MAX_TEXT_LENGTH) {
      extractedText = extractedText.slice(0, MAX_TEXT_LENGTH) + '\n\n...[content truncated]';
    }

    if (!extractedText) {
      return 'No text content could be extracted from this PDF file.';
    }

    return extractedText;

  } catch (error) {
    const errorMessage = (error as Error).message || 'Unknown error';
    
    logError(error as Error, {
      bufferSize: buffer?.length,
      errorType: 'PDF_EXTRACTION',
    });

    // Handle specific PDF.js errors
    if (errorMessage.includes('Invalid PDF')) {
      throw createAppError(
        'This file appears to be corrupted or is not a valid PDF',
        ErrorCode.FILE_PROCESSING_ERROR,
        400
      );
    }

    if (errorMessage.includes('Password')) {
      throw createAppError(
        'This PDF is password protected and cannot be processed',
        ErrorCode.FILE_PROCESSING_ERROR,
        400
      );
    }

    // Generic PDF processing error
    throw createAppError(
      'Failed to extract text from PDF. The file may be corrupted or contain non-text content.',
      ErrorCode.FILE_PROCESSING_ERROR,
      500,
      { originalError: errorMessage }
    );
  }
}

/**
 * Validates if a buffer contains a valid PDF
 */
export function validatePdfBuffer(buffer: Buffer): boolean {
  try {
    if (!buffer || buffer.length < 5) {
      return false;
    }

    // Check PDF header
    const header = buffer.slice(0, 5).toString();
    if (!header.startsWith('%PDF')) {
      return false;
    }

    // Check for PDF footer (optional but good practice)
    const footer = buffer.slice(-1024).toString();
    if (!footer.includes('%%EOF')) {
      console.warn('PDF may be incomplete - missing EOF marker');
      // Don't fail validation for missing EOF
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Gets PDF metadata without extracting full text
 */
export async function getPdfMetadata(buffer: Buffer): Promise<{
  numPages: number;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
}> {
  try {
    const uint8Array = new Uint8Array(buffer);
    const pdf = await getDocument({
      data: uint8Array,
      verbosity: 0,
    }).promise;

    const metadata = await pdf.getMetadata();
    const info = metadata.info as any;
    
    return {
      numPages: pdf.numPages,
      title: info?.Title,
      author: info?.Author,
      subject: info?.Subject,
      creator: info?.Creator,
      producer: info?.Producer,
      creationDate: info?.CreationDate,
      modificationDate: info?.ModDate,
    };

  } catch (error) {
    logError(error as Error, { operation: 'PDF_METADATA_EXTRACTION' });
    
    // Return minimal metadata on error
    return {
      numPages: 0,
    };
  }
} 