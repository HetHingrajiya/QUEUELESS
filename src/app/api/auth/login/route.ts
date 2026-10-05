import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import { User, UserRole } from '@/models/User';
import { SystemSettings } from '@/models/SystemSettings';

import { signToken } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !user.password) {
      await createAuditLog({
        action: 'LOGIN_FAILED',
        module: 'Authentication',
        description: `Failed login attempt for email: ${email} - User not found`,
        request,
        status: 'FAILED',
      });
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      await createAuditLog({
        action: 'LOGIN_FAILED',
        module: 'Authentication',
        description: `Failed login attempt for email: ${email} - Invalid password`,
        userId: user._id.toString(),
        userName: user.fullName,
        userRole: user.role,
        organizationId: user.organizationId?.toString(),
        officeId: user.officeId?.toString(),
        request,
        status: 'FAILED',
      });
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, message: 'Account is inactive' },
        { status: 403 }
      );
    }

    const token = signToken({
      userId: user._id.toString(),
      role: user.role,
      organizationId: user.organizationId?.toString(),
      officeId: user.officeId?.toString(),
    });

    user.lastLogin = new Date();
    await user.save();

    await createAuditLog({
      action: 'LOGIN',
      module: 'Authentication',
      description: 'User logged in successfully',
      userId: user._id.toString(),
      userName: user.fullName,
      userRole: user.role,
      organizationId: user.organizationId?.toString(),
      officeId: user.officeId?.toString(),
      request,
      status: 'SUCCESS',
    });

    const response = NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });

    // Apply Session Timeout from settings
    const settings = await SystemSettings.findOne();
    const sessionTimeoutMinutes = settings?.sessionTimeout || 120; // Default 2 hours

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: sessionTimeoutMinutes * 60,
    });


    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
