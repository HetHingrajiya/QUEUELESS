import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User, UserRole } from '@/models/User';
import bcrypt from 'bcryptjs';
import { sendMail } from '@/lib/mail';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { fullName, email, password, phone } = body;

    if (!fullName || !email || !password || !phone) {
      return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      if (existingUser.isVerified) {
        return NextResponse.json({ success: false, message: 'User with this email or phone already exists' }, { status: 400 });
      } else {
        // If unverified, we can either delete and recreate or update the OTP
        await User.deleteOne({ _id: existingUser._id });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create CITIZEN user
    const newUser = await User.create({
      fullName,
      email,
      phone,
      password: hashedPassword,
      role: UserRole.CITIZEN,
      status: 'ACTIVE',
      isVerified: false,
      otp,
      otpExpiry,
    });

    // Send OTP Email
    const emailTemplate = `
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
          <h2 style="margin-top: 0; color: #0f172a;">Welcome to SamaySetu!</h2>
          <p style="font-size: 16px; line-height: 1.5;">Thank you for registering. Please use the following One-Time Password (OTP) to complete your registration process.</p>
          <div class="otp-box">
            <p class="otp-code">${otp}</p>
          </div>
          <p style="font-size: 14px; color: #64748b;">This code will expire in 10 minutes.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} SamaySetu. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    `;

    await sendMail(email, 'Your SamaySetu Registration OTP', emailTemplate);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully. Please check your email.',
      data: {
        email: newUser.email
      }
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
