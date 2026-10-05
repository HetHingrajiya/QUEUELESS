import { NextResponse } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';

export async function POST(request: Request) {
  const user = await getUserFromCookie();

  if (user) {
    await createAuditLog({
      action: 'LOGOUT',
      module: 'Authentication',
      description: 'User logged out',
      userId: user.userId,
      userRole: user.role,
      organizationId: user.organizationId,
      officeId: user.officeId,
      request,
      status: 'SUCCESS',
    });
  }

  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  response.cookies.delete('token');
  
  return response;
}
