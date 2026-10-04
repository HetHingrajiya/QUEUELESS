import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const authHeader = request.headers.get('Authorization');
    let token = authHeader?.split(' ')[1];

    if (!token) {
      // Because we're in app router, let's just use request headers or cookies safely
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = Object.fromEntries(cookieHeader.split('; ').map(v => {
          const parts = v.split('=');
          return [parts[0], decodeURIComponent(parts.slice(1).join('='))];
        }));
        token = cookies['token'];
      }
    }

    if (!token) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
          officeId: user.officeId,
        }
      }
    });

  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
