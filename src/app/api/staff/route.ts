import { NextResponse } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User, UserRole } from '@/models/User';
import bcrypt from 'bcryptjs';
import { createAuditLog } from '@/lib/auditLogger';
import { requirePermission } from '@/lib/rbac';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const officeId = url.searchParams.get('officeId');
    const organizationId = url.searchParams.get('organizationId');
    
    const query: any = { role: UserRole.STAFF };
    if (officeId) query.officeId = officeId;
    if (organizationId) query.organizationId = organizationId;
    
    const staff = await User.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: staff });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    // Auth Check
    const user = await requirePermission('staff', 'add');
    if (!user) {
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
      role: UserRole.STAFF,
      organizationId: body.organizationId,
      officeId: body.officeId
    });

    await createAuditLog({
      action: 'CREATE',
      module: 'Staff',
      description: `Created new staff member: ${newUser.fullName}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'User',
      entityId: newUser._id.toString(),
      newData: newUser.toObject(),
      request,
    });

    return NextResponse.json({
      success: true,
      message: 'Staff created successfully',
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
