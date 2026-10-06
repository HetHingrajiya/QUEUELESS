import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Role } from '@/models/Role';
import { getUserFromCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const roles = await Role.find({ isSystem: true }).sort({ createdAt: 1 });
    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { rolePermissions } = await request.json(); // Array of { roleId, permissions: string[] }

    for (const update of rolePermissions) {
      if (update.roleName === 'SUPER_ADMIN') continue; // Do not modify super admin

      await Role.findByIdAndUpdate(update.roleId, {
        $set: { permissions: update.permissions }
      });
    }

    await createAuditLog({
      action: 'UPDATE',
      module: 'Permissions',
      description: `Updated system role permissions matrix`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'System',
      entityId: 'PERMISSIONS',
      newData: rolePermissions,
      request,
    });

    return NextResponse.json({ success: true, message: 'Permissions updated successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
