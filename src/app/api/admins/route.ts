import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User, UserRole } from '@/models/User';
import bcrypt from 'bcryptjs';
import { getUserFromCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    // Auth Check using JWT
    const currentUser = await getUserFromCookie();
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'User with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const newUser = await User.create({
      fullName: body.fullName,
      email: body.email,
      password: hashedPassword,
      role: UserRole.ADMIN,
      organizationId: body.organizationId
    });

    return NextResponse.json({
      success: true,
      message: 'Admin created successfully',
      data: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
