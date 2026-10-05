import dbConnect from '@/lib/db';
import { AuditLog } from '@/models/AuditLog';
import { headers } from 'next/headers';
import { getUserFromCookie } from '@/lib/auth';

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
      const headersList = await headers();
      ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '127.0.0.1';
      userAgent = headersList.get('user-agent') || 'Unknown';
    }

    // Attempt to fill in missing user details automatically
    let { userId, userName, userRole, organizationId, officeId } = params;
    
    if (!userId || !userRole || !organizationId || !userName) {
      const user = await getUserFromCookie();
      if (user) {
        userId = userId || user.userId;
        userRole = userRole || user.role;
        organizationId = organizationId || user.organizationId;
        officeId = officeId || user.officeId;

        if (!userName && userId) {
          const { User } = await import('@/models/User');
          const dbUser = await User.findById(userId).select('fullName email').lean();
          if (dbUser) {
            userName = dbUser.fullName || dbUser.email || 'SYSTEM';
          }
        }
      }
    }

    const log = new AuditLog({
      userId,
      userName,
      userRole,
      action: params.action,
      module: params.module,
      description: params.description,
      entityType: params.entityType,
      entityId: params.entityId,
      organizationId,
      officeId,
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
