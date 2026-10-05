import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User, UserRole } from '@/models/User';
import { getUserFromCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { createAuditLog } from '@/lib/auditLogger';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    
    // Auth Check
    const currentUser = await getUserFromCookie();
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const admin = await User.findOne({ _id: id, role: UserRole.ADMIN });
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: admin });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    
    // Auth Check
    const currentUser = await getUserFromCookie();
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    
    const updateData: any = {
      fullName: body.fullName,
      email: body.email,
      organizationId: body.organizationId
    };

    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 10);
    }

    const oldAdmin = await User.findOne({ _id: id, role: UserRole.ADMIN });
    if (!oldAdmin) {
      return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });
    }

    const updatedAdmin = await User.findOneAndUpdate(
      { _id: id, role: UserRole.ADMIN },
      { $set: updateData },
      { new: true }
    );

    if (!updatedAdmin) {
      return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });
    }

    await createAuditLog({
      action: 'UPDATE',
      module: 'Admins',
      description: `Updated admin: ${updatedAdmin.fullName}`,
      userId: currentUser.userId,
      userRole: currentUser.role,
      entityType: 'User',
      entityId: id,
      oldData: oldAdmin.toObject(),
      newData: updatedAdmin.toObject(),
      request,
    });

    return NextResponse.json({ success: true, message: 'Admin updated successfully', data: updatedAdmin });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    
    // Auth Check
    const currentUser = await getUserFromCookie();
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const oldAdmin = await User.findOne({ _id: id, role: UserRole.ADMIN });
    if (!oldAdmin) {
      return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });
    }

    const deletedAdmin = await User.findOneAndDelete({ _id: id, role: UserRole.ADMIN });

    if (!deletedAdmin) {
      return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });
    }

    await createAuditLog({
      action: 'DELETE',
      module: 'Admins',
      description: `Deleted admin: ${oldAdmin.fullName}`,
      userId: currentUser.userId,
      userRole: currentUser.role,
      entityType: 'User',
      entityId: id,
      oldData: oldAdmin.toObject(),
      request,
    });

    return NextResponse.json({ success: true, message: 'Admin deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
