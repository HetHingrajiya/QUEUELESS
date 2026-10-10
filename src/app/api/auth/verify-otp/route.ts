import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json({ success: false, message: 'Email and OTP are required' }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ success: false, message: 'User is already verified' }, { status: 400 });
    }

    if (user.otp !== otp) {
      return NextResponse.json({ success: false, message: 'Invalid OTP' }, { status: 400 });
    }

    if (user.otpExpiry && new Date() > user.otpExpiry) {
      return NextResponse.json({ success: false, message: 'OTP has expired' }, { status: 400 });
    }

    // OTP is valid
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Create session token
    const token = jwt.sign(
      { userId: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      success: true,
      message: 'Email verified and registration successful',
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
    console.error('OTP Verification error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
