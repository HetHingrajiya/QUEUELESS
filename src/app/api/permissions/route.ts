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
    // Ensure defaults exist for system roles if matrix is empty
    const { DEFAULT_PERMISSION_MATRIX } = await import('@/models/Role');
    
    for (const role of roles) {
      if (!role.permissionMatrix || role.permissionMatrix.size === 0) {
        if (DEFAULT_PERMISSION_MATRIX[role.name]) {
          role.permissionMatrix = DEFAULT_PERMISSION_MATRIX[role.name];
          await role.save();
        }
      }
    }

    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    console.error('Permissions API GET error:', error);
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

    const { rolePermissions } = await request.json(); // Array of { roleId, permissionMatrix: object }

    for (const update of rolePermissions) {
      if (update.roleName === 'SUPER_ADMIN') continue; // Do not modify super admin

      const role = await Role.findById(update.roleId);
      if (role) {
        if (!role.permissionMatrix) {
          role.permissionMatrix = new Map();
        } else {
          role.permissionMatrix.clear();
        }
        for (const [key, value] of Object.entries(update.permissionMatrix)) {
          role.permissionMatrix.set(key, value);
        }
        role.markModified('permissionMatrix');
        await role.save();
      }
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
    console.error('Permissions API PUT error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
