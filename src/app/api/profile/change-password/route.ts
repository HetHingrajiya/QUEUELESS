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
    if (!authUser) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ success: false, message: 'All fields are required.' }, { status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ success: false, message: 'New passwords do not match.' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, message: 'New password must be at least 8 characters.' }, { status: 400 });
    }

    const user = await User.findById(authUser.userId).select('+password');
    if (!user || !user.password) {
      return NextResponse.json({ success: false, message: 'User not found or password not set.' }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: 'Current password is incorrect.' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    user.password = hashed;
    await user.save();

    await createAuditLog({
      action: 'UPDATE',
      module: 'Profile',
      description: `User changed their password`,
      entityType: 'User',
      entityId: authUser.userId,
      request,
    });

    return NextResponse.json({ success: true, message: 'Password changed successfully.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
