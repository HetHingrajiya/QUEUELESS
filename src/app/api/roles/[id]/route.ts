import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import { Role } from '@/models/Role';
import { getUserFromCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const user = await getUserFromCookie();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const role = await Role.findById(id);
    if (!role) {
      return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 });
    }
    
    // Ensure admin can only see their org's roles or system roles
    if (user.role === 'ADMIN' && !role.isSystem && role.organizationId?.toString() !== user.organizationId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const user = await getUserFromCookie();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const oldRole = await Role.findById(id);
    if (!oldRole) {
      return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 });
    }
    
    if (oldRole.isSystem) {
       return NextResponse.json({ success: false, message: 'System roles cannot be modified' }, { status: 403 });
    }

    if (user.role === 'ADMIN' && oldRole.organizationId?.toString() !== user.organizationId) {
       return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    
    const updateData: any = {
      name: body.name,
      description: body.description,
      permissions: body.permissions || []
    };

    const updatedRole = await Role.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    );

    await createAuditLog({
      action: 'UPDATE',
      module: 'Roles',
      description: `Updated role: ${updatedRole.name}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'Role',
      entityId: id,
      oldData: oldRole.toObject(),
      newData: updatedRole.toObject(),
      request: req,
    });

    return NextResponse.json({ success: true, message: 'Role updated successfully', data: updatedRole });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'Role with this name already exists' }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const user = await getUserFromCookie();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const oldRole = await Role.findById(id);
    if (!oldRole) {
      return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 });
    }

    if (oldRole.isSystem) {
      return NextResponse.json({ success: false, message: 'System roles cannot be deleted' }, { status: 403 });
    }
    
    if (user.role === 'ADMIN' && oldRole.organizationId?.toString() !== user.organizationId) {
       return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await Role.findByIdAndDelete(id);

    await createAuditLog({
      action: 'DELETE',
      module: 'Roles',
      description: `Deleted role: ${oldRole.name}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'Role',
      entityId: id,
      oldData: oldRole.toObject(),
      request: req,
    });

    return NextResponse.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
