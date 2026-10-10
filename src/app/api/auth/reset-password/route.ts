import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { email, resetToken, newPassword } = body;

    if (!email || !resetToken || !newPassword) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, message: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
    }

    if (user.resetToken !== resetToken) {
      return NextResponse.json({ success: false, message: 'Invalid reset token' }, { status: 400 });
    }

    if (user.resetTokenExpiry && new Date() > user.resetTokenExpiry) {
      return NextResponse.json({ success: false, message: 'Reset session expired. Please request a new OTP.' }, { status: 400 });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    // Clear tokens
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    
    // Auto-verify user if they just recovered via email and hadn't verified yet
    if (!user.isVerified) {
      user.isVerified = true;
    }

    await user.save();

    // Auto log the user in after password reset
    const token = jwt.sign(
      { userId: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role }
      }
    });

    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;

  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
