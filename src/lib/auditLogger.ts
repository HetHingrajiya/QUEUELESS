import dbConnect from '@/lib/db';
import { AuditLog } from '@/models/AuditLog';
import { headers } from 'next/headers';

interface CreateAuditLogParams {
  userId?: string | null;
  userName?: string;
  userRole?: string;
  action: string;
  module: string;
  description: string;
  entityType?: string;
  entityId?: string;
  organizationId?: string | null;
  officeId?: string | null;
  oldData?: any;
  newData?: any;
  status?: string;
  request?: Request; // To extract IP and User-Agent
}

export async function createAuditLog(params: CreateAuditLogParams) {
  try {
    await dbConnect();
    
    let ipAddress = '127.0.0.1';
    let userAgent = 'Unknown';
    
    if (params.request) {
      const headersList = headers();
      ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '127.0.0.1';
      userAgent = headersList.get('user-agent') || 'Unknown';
    }

    const log = new AuditLog({
      userId: params.userId,
      userName: params.userName,
      userRole: params.userRole,
      action: params.action,
      module: params.module,
      description: params.description,
      entityType: params.entityType,
      entityId: params.entityId,
      organizationId: params.organizationId,
      officeId: params.officeId,
      oldData: params.oldData,
      newData: params.newData,
      ipAddress,
      userAgent,
      status: params.status || 'SUCCESS',
    });

    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // We don't throw here to prevent breaking the main flow if auditing fails
    return null;
  }
}
