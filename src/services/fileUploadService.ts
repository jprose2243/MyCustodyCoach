import { supabase } from '../lib/server-only/supabase-admin';
import { createAppError, ErrorCode, logError } from '../utils/errorHandler';
import { logAuditEvent, AuditEventType } from './auditService';
import { createHash } from 'crypto';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface FileUploadOptions {
  file: {
    mimetype: string | null;
    size: number;
    filepath: string;
    originalFilename?: string | null;
  };
  userId: string;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
}

export interface FileUploadResult {
  url?: string;
  path?: string;
  error?: string;
  status?: number;
}

export interface UserFile {
  id: string;
  user_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  file_hash: string;
  uploaded_at: string;
}

// Default configuration
const DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const DEFAULT_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
];

/**
 * Validates file upload requirements
 */
function validateFile(
  file: FileUploadOptions['file'],
  maxFileSize: number,
  allowedMimeTypes: string[]
): void {
  // Check file size
  if (file.size > maxFileSize) {
    throw createAppError(
      `File too large. Maximum size is ${Math.round(maxFileSize / (1024 * 1024))}MB`,
      ErrorCode.FILE_TOO_LARGE,
      413
    );
  }

  // Check MIME type
  if (!file.mimetype || !allowedMimeTypes.includes(file.mimetype)) {
    throw createAppError(
      `Unsupported file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
      ErrorCode.UNSUPPORTED_FILE_TYPE,
      415
    );
  }

  // Check if file exists
  if (!file.filepath) {
    throw createAppError(
      'Invalid file upload - no file path provided',
      ErrorCode.VALIDATION_ERROR,
      400
    );
  }
}

/**
 * Generates a secure file name to prevent path traversal and conflicts
 */
function generateSecureFileName(originalName: string, userId: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, extension)
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .substring(0, 50); // Limit length
  
  return `${userId}/${timestamp}-${randomString}-${baseName}${extension}`;
}

/**
 * Calculates file hash for integrity verification
 */
async function calculateFileHash(filePath: string): Promise<string> {
  try {
    const fileBuffer = await fs.readFile(filePath);
    return createHash('sha256').update(new Uint8Array(fileBuffer)).digest('hex');
  } catch {
    throw createAppError(
      'Failed to calculate file hash',
      ErrorCode.FILE_PROCESSING_ERROR,
      500,
      { filePath }
    );
  }
}

/**
 * Scans file for malware (placeholder for future implementation)
 */
async function scanFileForMalware(filePath: string): Promise<boolean> {
  // TODO: Integrate with ClamAV or similar antivirus service
  // For now, just check file size and basic validation
  try {
    const stats = await fs.stat(filePath);
    
    // Basic checks - reject extremely large files or empty files
    if (stats.size === 0) {
      throw createAppError(
        'Empty files are not allowed',
        ErrorCode.VALIDATION_ERROR,
        400
      );
    }
    
    // Additional malware scanning would go here
    return true;
  } catch (error) {
    logError(error as Error, { filePath });
    return false;
  }
}

/**
 * Main file upload handler
 */
export async function handleFileUpload(
  options: FileUploadOptions
): Promise<FileUploadResult> {
  const {
    file,
    userId,
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
    allowedMimeTypes = DEFAULT_ALLOWED_MIME_TYPES,
  } = options;

  try {
    // Validate input
    if (!userId) {
      throw createAppError(
        'User ID is required for file upload',
        ErrorCode.UNAUTHORIZED,
        401
      );
    }

    // Validate file
    validateFile(file, maxFileSize, allowedMimeTypes);

    // Security scan
    const isSafe = await scanFileForMalware(file.filepath);
    if (!isSafe) {
      throw createAppError(
        'File failed security scan',
        ErrorCode.FILE_PROCESSING_ERROR,
        400
      );
    }

    // Generate secure file name
    const secureFileName = generateSecureFileName(
      file.originalFilename || 'upload',
      userId
    );

    // Calculate file hash for integrity
    const fileHash = await calculateFileHash(file.filepath);

    // Read file data
    const fileData = await fs.readFile(file.filepath);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('user-files')
      .upload(secureFileName, fileData, {
        contentType: file.mimetype || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      throw createAppError(
        `Failed to upload file: ${uploadError.message}`,
        ErrorCode.SUPABASE_ERROR,
        500,
        { secureFileName, uploadError: uploadError.message }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('user-files')
      .getPublicUrl(secureFileName);

    // Store file metadata in database
    const { error: dbError } = await supabase
      .from('user_uploads')
      .insert([{
        user_id: userId,
        file_name: file.originalFilename || 'upload',
        file_size: file.size,
        mime_type: file.mimetype,
        storage_path: secureFileName,
        file_hash: fileHash,
        uploaded_at: new Date().toISOString(),
      }]);

    if (dbError) {
      console.warn('Failed to store file metadata:', dbError);
      // Don't fail the upload for metadata issues
    }

    // Log audit event
    await logAuditEvent({
      event_type: AuditEventType.FILE_UPLOAD,
      user_id: userId,
      metadata: {
        file_name: file.originalFilename || null,
        file_size: file.size,
        mime_type: file.mimetype || null,
        storage_path: secureFileName,
      },
    });

    // Clean up temporary file
    try {
      await fs.unlink(file.filepath);
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary file:', cleanupError);
    }

    return {
      url: urlData.publicUrl,
      path: secureFileName,
    };

  } catch (error) {
    const appError = error as Error & { statusCode?: number };
    
    logError(error as Error, { userId, fileName: file.originalFilename }, userId);

    // Clean up temporary file on error
    try {
      await fs.unlink(file.filepath);
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary file on error:', cleanupError);
    }

    return {
      error: appError.message || 'File upload failed',
      status: appError.statusCode || 500,
    };
  }
}

/**
 * Deletes a file from storage and database
 */
export async function deleteFile(
  storagePath: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify user owns the file
    const { data: fileRecord, error: fetchError } = await supabase
      .from('user_uploads')
      .select('*')
      .eq('storage_path', storagePath)
      .eq('user_id', userId)
      .single();

    if (fetchError || !fileRecord) {
      throw createAppError(
        'File not found or access denied',
        ErrorCode.FORBIDDEN,
        403
      );
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('user-files')
      .remove([storagePath]);

    if (storageError) {
      throw createAppError(
        `Failed to delete file from storage: ${storageError.message}`,
        ErrorCode.SUPABASE_ERROR,
        500
      );
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('user_uploads')
      .delete()
      .eq('storage_path', storagePath)
      .eq('user_id', userId);

    if (dbError) {
      console.warn('Failed to delete file record from database:', dbError);
    }

    // Log audit event
    await logAuditEvent({
      event_type: AuditEventType.FILE_DELETE,
      user_id: userId,
      metadata: {
        storage_path: storagePath,
        file_name: fileRecord.file_name,
      },
    });

    return { success: true };

  } catch (error) {
    logError(error as Error, { storagePath, userId }, userId);
    return {
      success: false,
      error: (error as Error).message || 'Failed to delete file',
    };
  }
}

/**
 * Gets file metadata for a user
 */
export async function getUserFiles(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<UserFile[]> {
  try {
    const { data, error } = await supabase
      .from('user_uploads')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw createAppError(
        `Failed to fetch user files: ${error.message}`,
        ErrorCode.SUPABASE_ERROR,
        500
      );
    }

    return data || [];

  } catch (error) {
    logError(error as Error, { userId }, userId);
    throw error;
  }
} 