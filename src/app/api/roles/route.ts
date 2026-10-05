import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Role } from '@/models/Role';
import { getUserFromCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    
    // Auth Check
    const user = await getUserFromCookie();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const query: any = {};
    if (user.role === 'SUPER_ADMIN') {
       if (organizationId) {
          query.$or = [{ isSystem: true }, { organizationId }];
       }
       // If no org specified, maybe return all roles or just system roles? Let's just return all for SUPER_ADMIN
    } else {
       query.$or = [{ isSystem: true }, { organizationId: user.organizationId }];
    }
    
    const roles = await Role.find(query).sort({ isSystem: -1, createdAt: -1 });
    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    // Auth Check
    const user = await getUserFromCookie();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    
    const isSystem = user.role === 'SUPER_ADMIN' && body.isSystem;

    const newRole = await Role.create({
      name: body.name,
      description: body.description,
      isSystem,
      permissions: body.permissions || [],
      organizationId: isSystem ? undefined : (body.organizationId || user.organizationId)
    });

    await createAuditLog({
      action: 'CREATE',
      module: 'Roles',
      description: `Created new role: ${newRole.name}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'Role',
      entityId: newRole._id.toString(),
      newData: newRole.toObject(),
      request,
    });

    return NextResponse.json({
      success: true,
      message: 'Role created successfully',
      data: newRole
    });
  } catch (error: any) {
     if (error.code === 11000) {
        return NextResponse.json({ success: false, message: 'Role with this name already exists' }, { status: 400 });
     }
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
