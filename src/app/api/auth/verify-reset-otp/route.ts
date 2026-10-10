import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import crypto from 'crypto';

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
      return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
    }

    if (user.otp !== otp) {
      return NextResponse.json({ success: false, message: 'Invalid OTP' }, { status: 400 });
    }

    if (user.otpExpiry && new Date() > user.otpExpiry) {
      return NextResponse.json({ success: false, message: 'OTP has expired' }, { status: 400 });
    }

    // OTP is valid. Clear it and generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes to reset password

    user.otp = undefined;
    user.otpExpiry = undefined;
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully.',
      data: { resetToken }
    });

  } catch (error: any) {
    console.error('Verify reset OTP error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
