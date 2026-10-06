import { NextResponse, NextRequest } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User, UserRole } from '@/models/User';
import bcrypt from 'bcryptjs';
import { createAuditLog } from '@/lib/auditLogger';
import { requirePermission } from '@/lib/rbac';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    
    // Auth Check
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    const query: any = { _id: id, role: UserRole.STAFF };
    
    if (user.role === 'ADMIN') {
      if (!user.organizationId) {
         return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
      }
      query.organizationId = user.organizationId;
    } else if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const staff = await User.findOne(query);
    
    if (!staff) {
      return NextResponse.json({ success: false, message: 'Staff not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: staff
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    
    // Auth Check
    const user = await requirePermission('staff', 'modify');
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    
    if (body.password) {
      body.password = await bcrypt.hash(body.password, 10);
    } else {
      delete body.password; // Don't overwrite with empty password
    }

    const query: any = { _id: id, role: UserRole.STAFF };
    if (user.role === 'ADMIN') {
       query.organizationId = user.organizationId;
    }

    const oldStaff = await User.findOne(query);
    if (!oldStaff) {
      return NextResponse.json({ success: false, message: 'Staff not found' }, { status: 404 });
    }

    const updatedStaff = await User.findOneAndUpdate(
      query,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedStaff) {
      return NextResponse.json({ success: false, message: 'Staff not found' }, { status: 404 });
    }

    await createAuditLog({
      action: 'UPDATE',
      module: 'Staff',
      description: `Updated staff member: ${updatedStaff.fullName}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'User',
      entityId: id,
      oldData: oldStaff.toObject(),
      newData: updatedStaff.toObject(),
      request: req,
    });

    return NextResponse.json({
      success: true,
      message: 'Staff updated successfully',
      data: updatedStaff
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    
    // Auth Check
    const user = await requirePermission('staff', 'delete');
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const query: any = { _id: id, role: UserRole.STAFF };
    if (user.role === 'ADMIN') {
       query.organizationId = user.organizationId;
    }

    const oldStaff = await User.findOne(query);
    if (!oldStaff) {
      return NextResponse.json({ success: false, message: 'Staff not found' }, { status: 404 });
    }

    const deletedStaff = await User.findOneAndDelete(query);

    if (!deletedStaff) {
      return NextResponse.json({ success: false, message: 'Staff not found' }, { status: 404 });
    }

    await createAuditLog({
      action: 'DELETE',
      module: 'Staff',
      description: `Deleted staff member: ${oldStaff.fullName}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'User',
      entityId: id,
      oldData: oldStaff.toObject(),
      request: req,
    });

    return NextResponse.json({
      success: true,
      message: 'Staff deleted successfully'
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
