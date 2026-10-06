import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Role } from '@/models/Role';
import { getUserFromCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';
import { ALL_PERMISSIONS } from '@/lib/permissions';

const SYSTEM_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CITIZEN']);

export async function GET() {
  try {
    await dbConnect();
    const user = await getUserFromCookie();
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const roles = await Role.find({ isSystem: true, name: { $in: Array.from(SYSTEM_ROLES) } })
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
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    if (!Array.isArray(body?.rolePermissions)) {
      return NextResponse.json({ success: false, message: 'rolePermissions must be an array' }, { status: 400 });
    }

    const updates = body.rolePermissions;
    const roles = await Role.find({
      _id: { $in: updates.map((item: any) => item?.roleId).filter(Boolean) },
      isSystem: true,
      name: { $in: Array.from(SYSTEM_ROLES) },
    }).lean();
    const roleMap = new Map(roles.map(role => [role._id.toString(), role]));

    for (const update of updates) {
      const role = roleMap.get(String(update?.roleId || ''));
      if (!role) {
        return NextResponse.json({ success: false, message: 'Invalid system role in permission update' }, { status: 400 });
      }

      if (role.name === 'SUPER_ADMIN') {
        if (Array.isArray(update.permissions) && update.permissions.length > 0) {
          return NextResponse.json({ success: false, message: 'SUPER_ADMIN permissions are immutable' }, { status: 400 });
        }
        continue;
      }

      if (!Array.isArray(update.permissions)) {
        return NextResponse.json({ success: false, message: `Permissions for ${role.name} must be an array` }, { status: 400 });
      }

      const invalid = update.permissions.filter(
        (permission: unknown) => typeof permission !== 'string' || !ALL_PERMISSIONS.includes(permission as any)
      );
      if (invalid.length) {
        return NextResponse.json({ success: false, message: `Invalid permissions for ${role.name}`, invalid }, { status: 400 });
      }

      const permissions = [...new Set(update.permissions as string[])];
      await Role.findByIdAndUpdate(role._id, { $set: { permissions } }, { runValidators: true });
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

    return NextResponse.json({ success: true, message: 'Permissions updated successfully' });
  } catch (error) {
    console.error('Permissions PUT error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
