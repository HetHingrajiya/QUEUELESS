import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { getUserFromCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { createAuditLog } from '@/lib/auditLogger';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const authUser = await getUserFromCookie();
    if (!authUser || !authUser.userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, message: 'Current and new passwords are required.' }, { status: 400 });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json({ success: false, message: 'New password must be at least 8 characters long.' }, { status: 400 });
    }

    const user = await User.findById(authUser.userId).select('+password');
    if (!user || !user.password) {
      return NextResponse.json({ success: false, message: 'User not found or password not configured.' }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: 'Current password is incorrect.' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    user.password = hashed;
    await user.save();

    await createAuditLog({
      action: 'PASSWORD_CHANGED',
      module: 'AUTH',
      description: `User changed account password`,
      entityType: 'User',
      entityId: authUser.userId,
      userId: authUser.userId,
      userRole: authUser.role,
      request,
    });

    return NextResponse.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
