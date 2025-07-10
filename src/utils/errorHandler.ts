import { isDevelopment } from './env';

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  context?: Record<string, any>;
  userId?: string;
  timestamp?: Date;
}

export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // External Services
  OPENAI_ERROR = 'OPENAI_ERROR',
  SUPABASE_ERROR = 'SUPABASE_ERROR',
  STRIPE_ERROR = 'STRIPE_ERROR',
  
  // File Processing
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UNSUPPORTED_FILE_TYPE = 'UNSUPPORTED_FILE_TYPE',
  FILE_PROCESSING_ERROR = 'FILE_PROCESSING_ERROR',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Business Logic
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  SUBSCRIPTION_REQUIRED = 'SUBSCRIPTION_REQUIRED',
  
  // System
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/**
 * Creates a standardized application error
 */
export function createAppError(
  message: string,
  code: ErrorCode,
  statusCode: number = 500,
  context?: Record<string, any>
): AppError {
  const error: AppError = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  error.context = context;
  error.timestamp = new Date();
  
  return error;
}

/**
 * Logs an error with appropriate context and severity
 */
export function logError(
  error: Error | AppError,
  context?: Record<string, any>,
  userId?: string
): void {
  const timestamp = new Date().toISOString();
  const errorDetails = {
    timestamp,
    message: error.message,
    stack: error.stack,
    code: (error as AppError).code,
    statusCode: (error as AppError).statusCode,
    context: {
      ...(error as AppError).context,
      ...context,
    },
    userId,
  };

  // In development, log to console for debugging
  if (isDevelopment) {
    console.error('🚨 Application Error:', errorDetails);
  }

  // In production, send to monitoring service (Sentry, LogRocket, etc.)
  if (!isDevelopment) {
    // TODO: Integrate with monitoring service
    console.error('Error logged to monitoring:', {
      message: error.message,
      code: (error as AppError).code,
      userId,
      timestamp,
    });
  }

  // Store critical errors in database for audit trail
  if (shouldStoreError(error as AppError)) {
    storeErrorInDatabase(errorDetails).catch(dbError => {
      console.error('Failed to store error in database:', dbError);
    });
  }
}

/**
 * Determines if an error should be stored in the database
 */
function shouldStoreError(error: AppError): boolean {
  const criticalCodes = [
    ErrorCode.UNAUTHORIZED,
    ErrorCode.RATE_LIMIT_EXCEEDED,
    ErrorCode.INTERNAL_ERROR,
    ErrorCode.SERVICE_UNAVAILABLE,
  ];
  
  return criticalCodes.includes(error.code as ErrorCode) || 
         Boolean(error.statusCode && error.statusCode >= 500);
}

/**
 * Stores error details in database for audit trail
 */
async function storeErrorInDatabase(errorDetails: any): Promise<void> {
  try {
    // TODO: Implement database storage
    // This would typically insert into an error_logs table
    console.log('Error stored in audit log:', errorDetails.timestamp);
  } catch (err) {
    // Fail silently to avoid error loops
    console.error('Failed to store error in database:', err);
  }
}

/**
 * Sanitizes error for client response
 */
export function sanitizeErrorForClient(error: Error | AppError): {
  message: string;
  code?: string;
  statusCode?: number;
} {
  const appError = error as AppError;
  
  // In development, return full error details
  if (isDevelopment) {
    return {
      message: error.message,
      code: appError.code,
      statusCode: appError.statusCode,
    };
  }

  // In production, sanitize sensitive information
  const isClientSafeError = appError.statusCode && appError.statusCode < 500;
  
  return {
    message: isClientSafeError 
      ? error.message 
      : 'An unexpected error occurred. Please try again.',
    code: isClientSafeError ? appError.code : ErrorCode.INTERNAL_ERROR,
    statusCode: appError.statusCode || 500,
  };
}

/**
 * Wraps async functions with error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: Record<string, any>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error as Error, context);
      throw error;
    }
  };
} 