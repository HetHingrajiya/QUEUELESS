import { NextResponse, NextRequest } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User, UserRole } from '@/models/User';
import bcrypt from 'bcryptjs';
import { createAuditLog } from '@/lib/auditLogger';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    
    const staff = await User.findOne({ _id: id, role: UserRole.STAFF });
    
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
    const user = await getUserFromCookie();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    
    if (body.password) {
      body.password = await bcrypt.hash(body.password, 10);
    } else {
      delete body.password; // Don't overwrite with empty password
    }

    const oldStaff = await User.findOne({ _id: id, role: UserRole.STAFF });
    if (!oldStaff) {
      return NextResponse.json({ success: false, message: 'Staff not found' }, { status: 404 });
    }

    const updatedStaff = await User.findOneAndUpdate(
      { _id: id, role: UserRole.STAFF },
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
    const user = await getUserFromCookie();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const oldStaff = await User.findOne({ _id: id, role: UserRole.STAFF });
    if (!oldStaff) {
      return NextResponse.json({ success: false, message: 'Staff not found' }, { status: 404 });
    }

    const deletedStaff = await User.findOneAndDelete({ _id: id, role: UserRole.STAFF });

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
