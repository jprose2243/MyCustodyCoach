import { NextRequest, NextResponse } from 'next/server';
import { handleFileUpload } from '@/src/services/fileUploadService';
import { extractTextFromFile, validateFileType } from '@/src/utils/extractTextFromFile';
import { logAuditEvent, AuditEventType, extractClientInfo } from '@/src/services/auditService';
import { createAppError, ErrorCode, sanitizeErrorForClient } from '@/src/utils/errorHandler';
import { Readable } from 'stream';
import { IncomingMessage } from 'http';
import formidable from 'formidable';
import { rateLimit } from '@/src/middleware/rateLimit';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseMultipart(req: NextRequest): Promise<{ file: formidable.File; userId: string }> {
  const contentType = req.headers.get('content-type') || '';
  const contentLength = req.headers.get('content-length') || '';
  const blob = await req.blob();
  const buffer = Buffer.from(await blob.arrayBuffer());

  const stream = Readable.from(buffer);
  const mockReq = Object.assign(stream, {
    headers: {
      'content-type': contentType,
      'content-length': contentLength,
    },
  }) as unknown as IncomingMessage;

  const form = formidable({
    maxFileSize: 500 * 1024 * 1024,
    allowEmptyFiles: false,
    multiples: false,
  });

  return new Promise((resolve, reject) => {
    form.parse(mockReq, (err, fields, files) => {
      const file = files?.file;
      const userId = fields?.userId;
      if (err || !file || !userId) {
        return reject(new Error('❌ Invalid upload: file and userId required.'));
      }
      resolve({
        file: Array.isArray(file) ? file[0] : file,
        userId: Array.isArray(userId) ? userId[0] : userId,
      });
    });
  });
}

export async function POST(req: NextRequest) {
  const { ip_address, user_agent } = extractClientInfo(req);
  const { allowed, retryAfter } = rateLimit(ip_address);
  
  if (!allowed) {
    await logAuditEvent({
      event_type: AuditEventType.RATE_LIMIT_EXCEEDED,
      user_id: null,
      ip_address,
      user_agent,
      metadata: { endpoint: '/api/upload-to-supabase' },
    });
    
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' }, 
      { 
        status: 429, 
        headers: { 'Retry-After': retryAfter?.toString() || '60' } 
      }
    );
  }

  try {
    const { file, userId } = await parseMultipart(req);
    
    // Enhanced validation
    if (!file.mimetype) {
      throw createAppError(
        'File type could not be determined',
        ErrorCode.VALIDATION_ERROR,
        400
      );
    }

    // Validate file type by checking magic bytes
    const fs = await import('fs/promises');
    const buffer = await fs.readFile(file.filepath);
    
    if (!validateFileType(buffer, file.mimetype)) {
      throw createAppError(
        'File content does not match the declared file type',
        ErrorCode.VALIDATION_ERROR,
        400
      );
    }

    // Extract text content from the file for AI processing
    let extractedText = '';
    try {
      extractedText = await extractTextFromFile(buffer, file.mimetype);
      console.log(`📄 Extracted ${extractedText.length} characters from ${file.originalFilename}`);
    } catch (textError) {
      console.warn('⚠️ Text extraction failed, continuing without content:', textError);
      // Continue with upload even if text extraction fails
    }

    // Use the robust file upload service
    const result = await handleFileUpload({
      file: {
        mimetype: file.mimetype,
        size: file.size,
        filepath: file.filepath,
        originalFilename: file.originalFilename || null,
      },
      userId,
    });

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error }, 
        { status: result.status || 500 }
      );
    }

    // Return enhanced response with extracted text
    return NextResponse.json({
      ...result,
      extractedText: extractedText || '',
      fileKey: result.path, // For compatibility with frontend
    });
    
  } catch (err: unknown) {
    const sanitized = sanitizeErrorForClient(err as Error);
    
    return NextResponse.json(
      { error: sanitized.message },
      { status: sanitized.statusCode || 500 }
    );
  }
}