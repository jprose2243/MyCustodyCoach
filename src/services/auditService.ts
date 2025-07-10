import { supabase } from '../lib/server-only/supabase-admin';
import { logError, createAppError, ErrorCode } from '../utils/errorHandler';

export enum AuditEventType {
  // Authentication Events
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_REGISTRATION = 'USER_REGISTRATION',
  
  // File Operations
  FILE_UPLOAD = 'FILE_UPLOAD',
  FILE_DOWNLOAD = 'FILE_DOWNLOAD',
  FILE_DELETE = 'FILE_DELETE',
  
  // AI Operations
  AI_QUERY_SUBMITTED = 'AI_QUERY_SUBMITTED',
  AI_RESPONSE_GENERATED = 'AI_RESPONSE_GENERATED',
  
  // Payment Events
  SUBSCRIPTION_CREATED = 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_CANCELLED = 'SUBSCRIPTION_CANCELLED',
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  
  // Security Events
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  MODERATION_FLAG = 'MODERATION_FLAG',
  
  // Data Events
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_DELETION = 'DATA_DELETION',
}

export interface AuditEvent {
  id?: string;
  event_type: AuditEventType;
  user_id: string | null;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, string | number | boolean | null>;
  created_at?: string;
}

/**
 * Logs an audit event to the database
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const auditRecord = {
      event_type: event.event_type,
      user_id: event.user_id,
      ip_address: event.ip_address,
      user_agent: event.user_agent,
      metadata: event.metadata || {},
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('audit_logs')
      .insert([auditRecord]);

    if (error) {
      throw createAppError(
        `Failed to log audit event: ${error.message}`,
        ErrorCode.SUPABASE_ERROR,
        500,
        { event_type: event.event_type, user_id: event.user_id }
      );
    }

    console.log(`📊 Audit logged: ${event.event_type} for user ${event.user_id}`);
  } catch (error) {
    logError(error as Error, { 
      event_type: event.event_type,
      user_id: event.user_id 
    }, event.user_id || undefined);
    // Don't throw - audit logging should not break application flow
  }
}

/**
 * Retrieves audit logs for a specific user (for GDPR compliance)
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 100,
  offset: number = 0
): Promise<AuditEvent[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw createAppError(
        `Failed to retrieve user audit logs: ${error.message}`,
        ErrorCode.SUPABASE_ERROR,
        500,
        { userId }
      );
    }

    return data || [];
  } catch (error) {
    logError(error as Error, { userId }, userId);
    throw error;
  }
}

/**
 * Retrieves security-related audit logs for monitoring
 */
export async function getSecurityAuditLogs(
  startDate: Date,
  endDate: Date,
  limit: number = 500
): Promise<AuditEvent[]> {
  try {
    const securityEvents = [
      AuditEventType.RATE_LIMIT_EXCEEDED,
      AuditEventType.UNAUTHORIZED_ACCESS,
      AuditEventType.MODERATION_FLAG,
    ];

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .in('event_type', securityEvents)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw createAppError(
        `Failed to retrieve security audit logs: ${error.message}`,
        ErrorCode.SUPABASE_ERROR,
        500
      );
    }

    return data || [];
  } catch (error) {
    logError(error as Error, { 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString() 
    });
    throw error;
  }
}

/**
 * Deletes old audit logs (for compliance with data retention policies)
 */
export async function cleanupOldAuditLogs(retentionDays: number = 365): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const { error, count } = await supabase
      .from('audit_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      throw createAppError(
        `Failed to cleanup old audit logs: ${error.message}`,
        ErrorCode.SUPABASE_ERROR,
        500
      );
    }

    const deletedCount = count || 0;
    console.log(`🧹 Cleaned up ${deletedCount} audit logs older than ${retentionDays} days`);
    
    return deletedCount;
  } catch (error) {
    logError(error as Error, { retentionDays });
    throw error;
  }
}

/**
 * Helper function to extract client information from request
 */
export function extractClientInfo(request: Request): {
  ip_address: string;
  user_agent: string;
} {
  const ip_address = 
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';
    
  const user_agent = request.headers.get('user-agent') || 'unknown';
  
  return { ip_address, user_agent };
} 