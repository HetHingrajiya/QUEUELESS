import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { getUserFromCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { createAuditLog } from '@/lib/auditLogger';

export async function GET() {
  try {
    await dbConnect();
    const authUser = await getUserFromCookie();
    if (!authUser) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const user = await User.findById(authUser.userId)
      .select('-password')
      .populate('organizationId', 'name code')
      .populate('officeId', 'name')
      .lean();

    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect();
    const authUser = await getUserFromCookie();
    if (!authUser) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const allowedFields: Record<string, any> = {};

    // Only allow safe user-editable fields
    if (body.fullName && typeof body.fullName === 'string') allowedFields.fullName = body.fullName.trim();
    if (body.mobile && typeof body.mobile === 'string') allowedFields.mobile = body.mobile.trim();

    if (Object.keys(allowedFields).length === 0) {
      return NextResponse.json({ success: false, message: 'No valid fields to update.' }, { status: 400 });
    }

    const updated = await User.findByIdAndUpdate(
      authUser.userId,
      { $set: allowedFields },
      { new: true, select: '-password' }
    ).populate('organizationId', 'name code').populate('officeId', 'name').lean();

    await createAuditLog({
      action: 'UPDATE',
      module: 'Profile',
      description: `User updated their profile`,
      entityType: 'User',
      entityId: authUser.userId,
      newData: allowedFields,
      request,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
