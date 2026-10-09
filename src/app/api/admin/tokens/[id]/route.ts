import { NextResponse, NextRequest } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Token, TokenStatus } from '@/models/Token';
import { Counter } from '@/models/Counter';
import { User, UserRole } from '@/models/User';
import { Office } from '@/models/Office';
import { createAuditLog } from '@/lib/auditLogger';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const user = await getUserFromCookie();
    if (!user || user.role === 'CITIZEN' || user.role === 'STAFF') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const token = await Token.findById(id).lean();
    if (!token) {
      return NextResponse.json({ success: false, message: 'Token not found' }, { status: 404 });
    }

    if (user.role === 'ADMIN') {
      const office = await Office.findById(token.officeId).lean();
      if (!office || office.organizationId?.toString() !== user.organizationId) {
         return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
      }
    }

    return NextResponse.json({ success: true, data: token });
  } catch (error: any) {
    console.error('Fetch Token Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const user = await getUserFromCookie();
    if (!user || user.role === 'CITIZEN' || user.role === 'STAFF') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    // RBAC
    if (user.role === 'ADMIN') {
      const { hasPermission } = await import('@/lib/permissions');
      const canManageQueue = await hasPermission(user.userId, 'MANAGE_QUEUE');
      if (!canManageQueue) {
        return NextResponse.json({ success: false, message: 'Forbidden: Missing MANAGE_QUEUE permission' }, { status: 403 });
      }
    }

    const body = await req.json();
    const { status, counterId, staffId } = body;

    const oldToken = await Token.findById(id);
    if (!oldToken) {
      return NextResponse.json({ success: false, message: 'Token not found' }, { status: 404 });
    }

    let organizationId = null;

    if (user.role === 'ADMIN') {
      const office = await Office.findById(oldToken.officeId).lean();
      if (!office || office.organizationId?.toString() !== user.organizationId) {
         return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
      }
      organizationId = office.organizationId;
    } else if (user.role === 'SUPER_ADMIN') {
       const office = await Office.findById(oldToken.officeId).lean();
       if (office) organizationId = office.organizationId;
    }

    const updateData: any = {};
    if (status !== undefined) {
      if (!Object.values(TokenStatus).includes(status as TokenStatus)) {
        return NextResponse.json({ success: false, message: 'Invalid token status' }, { status: 400 });
      }
      updateData.status = status;
    }

    if (counterId !== undefined && counterId !== null && counterId !== '') {
      const targetCounter = await Counter.findById(counterId).lean();
      if (!targetCounter || targetCounter.officeId.toString() !== oldToken.officeId.toString()) {
        return NextResponse.json({ success: false, message: 'Counter must belong to the token office' }, { status: 400 });
      }
      if (targetCounter.serviceIds?.length &&
          !targetCounter.serviceIds.some((id: any) => id.toString() === oldToken.serviceId.toString())) {
        return NextResponse.json({ success: false, message: 'Counter is not configured for the token service' }, { status: 400 });
      }
      updateData.counterId = counterId;
    } else if (counterId !== undefined) {
      updateData.counterId = null;
    }

    if (staffId !== undefined && staffId !== null && staffId !== '') {
      const assignedStaff = await User.findById(staffId).lean();
      const tokenOffice = await Office.findById(oldToken.officeId).lean();
      if (!assignedStaff || assignedStaff.role !== UserRole.STAFF ||
          assignedStaff.status !== 'ACTIVE' ||
          assignedStaff.officeId?.toString() !== oldToken.officeId.toString() ||
          assignedStaff.organizationId?.toString() !== tokenOffice?.organizationId?.toString()) {
        return NextResponse.json({ success: false, message: 'Assigned staff must be active and belong to the token office and organization' }, { status: 400 });
      }
      updateData.staffId = staffId;
    } else if (staffId !== undefined) {
      updateData.staffId = null;
    }

    const token = await Token.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    await createAuditLog({
      action: 'UPDATE',
      module: 'Queue',
      description: `Updated token: ${token?.tokenNumber}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'Token',
      entityId: id,
      oldData: oldToken.toObject(),
      newData: token?.toObject(),
      organizationId: organizationId,
      request: req,
    });

    if (!token) {
      return NextResponse.json({ success: false, message: 'Token not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: token });
  } catch (error: any) {
    console.error('Update Token Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const user = await getUserFromCookie();
    if (!user || user.role === 'CITIZEN' || user.role === 'STAFF') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    // RBAC
    if (user.role === 'ADMIN') {
      const { hasPermission } = await import('@/lib/permissions');
      const canManageQueue = await hasPermission(user.userId, 'MANAGE_QUEUE');
      if (!canManageQueue) {
        return NextResponse.json({ success: false, message: 'Forbidden: Missing MANAGE_QUEUE permission' }, { status: 403 });
      }
    }

    const oldToken = await Token.findById(id);
    if (!oldToken) {
      return NextResponse.json({ success: false, message: 'Token not found' }, { status: 404 });
    }

    let organizationId = null;

    if (user.role === 'ADMIN') {
      const office = await Office.findById(oldToken.officeId).lean();
      if (!office || office.organizationId?.toString() !== user.organizationId) {
         return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
      }
      organizationId = office.organizationId;
    } else if (user.role === 'SUPER_ADMIN') {
       const office = await Office.findById(oldToken.officeId).lean();
       if (office) organizationId = office.organizationId;
    }

    const token = await Token.findByIdAndDelete(id);
    
    if (!token) {
      return NextResponse.json({ success: false, message: 'Token not found' }, { status: 404 });
    }

    await createAuditLog({
      action: 'DELETE',
      module: 'Queue',
      description: `Deleted token: ${oldToken.tokenNumber}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'Token',
      entityId: id,
      oldData: oldToken.toObject(),
      organizationId: organizationId,
      request: req,
    });

    return NextResponse.json({ success: true, message: 'Token deleted successfully' });
  } catch (error: any) {
    console.error('Delete Token Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
