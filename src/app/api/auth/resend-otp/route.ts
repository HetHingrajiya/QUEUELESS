import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { sendMail } from '@/lib/mail';

const generateOtpTemplate = (otp: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
    .header { background-color: #111111; padding: 30px; text-align: center; }
    .header h1 { color: #fde047; margin: 0; font-size: 28px; letter-spacing: 1px; }
    .content { padding: 40px 30px; text-align: center; color: #334155; }
    .otp-box { background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 20px; margin: 30px 0; }
    .otp-code { font-size: 42px; font-weight: bold; color: #0f172a; letter-spacing: 8px; margin: 0; }
    .footer { background-color: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SamaySetu</h1>
    </div>
    <div class="content">
      <h2 style="margin-top: 0; color: #0f172a;">Verify your email address</h2>
      <p style="font-size: 16px; line-height: 1.5;">Thank you for registering with SamaySetu. Please use the following One-Time Password (OTP) to complete your registration process.</p>
      
      <div class="otp-box">
        <p class="otp-code">${otp}</p>
      </div>
      
      <p style="font-size: 14px; color: #64748b;">This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} SamaySetu. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ success: false, message: 'User is already verified' }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP Email
    await sendMail(email, 'Your SamaySetu Resend OTP', generateOtpTemplate(otp));

    return NextResponse.json({
      success: true,
      message: 'OTP resent successfully.',
    });

  } catch (error: any) {
    console.error('Resend OTP error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
