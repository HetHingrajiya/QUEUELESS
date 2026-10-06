import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Role } from '@/models/Role';
import { getUserFromCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';

const AVAILABLE_PERMISSIONS = new Set([
  'MANAGE_ORGANIZATIONS',
  'MANAGE_OFFICES',
  'MANAGE_SERVICES',
  'MANAGE_STAFF',
  'MANAGE_QUEUE',
  'VIEW_ANALYTICS',
  'MANAGE_SETTINGS',
]);

const SYSTEM_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CITIZEN']);

export async function GET() {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const roles = await Role.find({ isSystem: true })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    console.error('Permissions GET error:', error);
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

    const body = await request.json();
    if (!Array.isArray(body?.rolePermissions)) {
      return NextResponse.json({ success: false, message: 'rolePermissions must be an array' }, { status: 400 });
    }

    const updates = body.rolePermissions;
    const roleIds = updates.map((item: any) => item?.roleId).filter(Boolean);

    const roles = await Role.find({
      _id: { $in: roleIds },
      isSystem: true,
      name: { $in: Array.from(SYSTEM_ROLES) },
    }).lean();

    const roleMap = new Map(roles.map(role => [role._id.toString(), role]));

    for (const update of updates) {
      const role = roleMap.get(String(update?.roleId || ''));
      if (!role) {
        return NextResponse.json({ success: false, message: 'Invalid system role in permission update' }, { status: 400 });
      }

      // SUPER_ADMIN is always full access and cannot be changed from this matrix.
      if (role.name === 'SUPER_ADMIN') continue;

      if (!Array.isArray(update.permissions)) {
        return NextResponse.json({ success: false, message: `Permissions for ${role.name} must be an array` }, { status: 400 });
      }

      const permissions = [...new Set(update.permissions.filter(
        (permission: unknown): permission is string =>
          typeof permission === 'string' && AVAILABLE_PERMISSIONS.has(permission)
      ))];

      await Role.findByIdAndUpdate(role._id, {
        $set: { permissions }
      });
    }

    await createAuditLog({
      action: 'UPDATE',
      module: 'Permissions',
      description: 'Updated system role permissions matrix',
      userId: user.userId,
      userRole: user.role,
      entityType: 'System',
      entityId: 'PERMISSIONS',
      newData: updates,
      request,
    });

    return NextResponse.json({
      success: true,
      message: 'Permissions updated successfully'
    });
  } catch (error) {
    console.error('Permissions PUT error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
