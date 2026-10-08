import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getUserFromCookie();

    if (!session || session.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const citizen = await User.findById(session.userId)
      .select('-passwordHash')
      .lean();

    if (!citizen) {
      return NextResponse.json({ success: false, message: 'Citizen profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: citizen
    });

  } catch (error: any) {
    console.error('Citizen Profile GET error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getUserFromCookie();

    if (!session || session.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { name, phone, address, settings } = body;

    // Only allow updating safe fields
    const updateData: any = {};
    if (typeof name === 'string' && name.trim()) updateData.name = name.trim();
    if (typeof phone === 'string') updateData.phone = phone.trim();
    if (typeof address === 'string') updateData.address = address.trim();
    if (settings && typeof settings === 'object') updateData.settings = settings;

    const updatedUser = await User.findByIdAndUpdate(
      session.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!updatedUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error: any) {
    console.error('Citizen Profile PUT error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getUserFromCookie();

    if (!session || session.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    // Securely deactivate citizen profile
    await User.findByIdAndUpdate(session.userId, {
      $set: { isActive: false, email: `deleted_${Date.now()}_${session.userId}@queueless.gov` }
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account successfully deactivated'
    });

    // Clear auth cookie
    response.cookies.delete('auth_token');
    return response;

  } catch (error: any) {
    console.error('Citizen Delete Account error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
