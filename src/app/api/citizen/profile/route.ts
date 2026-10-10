import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { getUserFromCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';

export async function GET() {
  try {
    await dbConnect();
    const session = await getUserFromCookie();

    if (!session || !session.userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    if (session.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    if (!mongoose.Types.ObjectId.isValid(session.userId)) {
      return NextResponse.json({ success: false, message: 'Invalid User ID' }, { status: 400 });
    }

    const citizen = await User.findById(session.userId)
      .select('-password -passwordHash -salt')
      .lean();

    if (!citizen) {
      return NextResponse.json({ success: false, message: 'Citizen profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: citizen
    });

  } catch (error) {
    console.error('Citizen Profile GET error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getUserFromCookie();

    if (!session || !session.userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    if (session.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    if (!mongoose.Types.ObjectId.isValid(session.userId)) {
      return NextResponse.json({ success: false, message: 'Invalid User ID' }, { status: 400 });
    }

    const body = await req.json();
    const { name, fullName, phone, mobile, address, dob, settings } = body;

    // Explicitly reject modifications to forbidden fields if provided
    const forbiddenFields = ['role', 'organizationId', 'officeId', 'permissions', 'isActive', 'status', 'roleId', 'serviceId', 'counterId', 'employeeId'];
    for (const f of forbiddenFields) {
      if (body[f] !== undefined) {
        return NextResponse.json({
          success: false,
          message: `Field '${f}' cannot be modified by citizen`
        }, { status: 400 });
      }
    }

    // Only allow updating safe fields
    const updateData: Record<string, unknown> = {};
    if (typeof fullName === 'string' && fullName.trim()) updateData.fullName = fullName.trim();
    if (typeof name === 'string' && name.trim()) {
      updateData.fullName = name.trim();
      updateData.name = name.trim();
    }
    const incomingPhone = phone || mobile;
    if (typeof incomingPhone === 'string') {
      updateData.mobile = incomingPhone.trim();
    }
    if (typeof address === 'string') updateData.address = address.trim();
    if (typeof dob === 'string') updateData.dob = dob.trim();

    if (settings && typeof settings === 'object') {
      interface UserWithSettings {
        settings?: {
          notifications?: Record<string, boolean>;
          privacy?: Record<string, boolean>;
          language?: string;
          darkMode?: boolean;
          biometric?: boolean;
        };
      }
      const existingUser = await User.findById(session.userId).lean() as unknown as UserWithSettings | null;
      const currentSettings = existingUser?.settings && typeof existingUser.settings === 'object' ? existingUser.settings : {};

      const mergedSettings = { ...currentSettings };
      if (settings.notifications && typeof settings.notifications === 'object') {
        mergedSettings.notifications = {
          ...(mergedSettings.notifications || {}),
          ...settings.notifications
        };
      }
      if (settings.privacy && typeof settings.privacy === 'object') {
        mergedSettings.privacy = {
          ...(mergedSettings.privacy || {}),
          ...settings.privacy
        };
      }
      if (typeof settings.language === 'string') {
        mergedSettings.language = settings.language;
      }
      if (typeof settings.darkMode === 'boolean') {
        mergedSettings.darkMode = settings.darkMode;
      }
      if (typeof settings.biometric === 'boolean') {
        mergedSettings.biometric = settings.biometric;
      }
      updateData.settings = mergedSettings;
    }

    const updatedUser = await User.findByIdAndUpdate(
      session.userId,
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    ).select('-password -passwordHash -salt');

    if (!updatedUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    await createAuditLog({
      action: 'UPDATE_PROFILE',
      module: 'CITIZEN',
      description: `Citizen updated their profile information`,
      entityType: 'User',
      entityId: session.userId,
      userId: session.userId,
      userRole: session.role,
      request: req
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Citizen Profile PUT error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getUserFromCookie();

    if (!session || !session.userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    if (session.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    if (!mongoose.Types.ObjectId.isValid(session.userId)) {
      return NextResponse.json({ success: false, message: 'Invalid User ID' }, { status: 400 });
    }

    // Securely deactivate citizen profile
    await User.findByIdAndUpdate(session.userId, {
      $set: { isActive: false, email: `deleted_${Date.now()}_${session.userId}@samaysetu.gov` }
    });

    await createAuditLog({
      action: 'DEACTIVATE_ACCOUNT',
      module: 'CITIZEN',
      description: `Citizen requested account deactivation`,
      entityType: 'User',
      entityId: session.userId,
      userId: session.userId,
      userRole: session.role,
      request: req
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account successfully deactivated'
    });

    // Clear auth cookies
    response.cookies.delete('token');
    response.cookies.delete('auth_token');
    return response;

  } catch (error) {
    console.error('Citizen Delete Account error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
