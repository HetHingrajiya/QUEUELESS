import { NextResponse } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User, UserRole } from '@/models/User';
import bcrypt from 'bcryptjs';
import { createAuditLog } from '@/lib/auditLogger';


export async function GET(request: Request) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();
    
    if (!user || user.role === 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }
    
    const url = new URL(request.url);
    const officeId = url.searchParams.get('officeId');
    const organizationId = url.searchParams.get('organizationId');
    
    const query: any = { role: UserRole.STAFF };
    
    // Organization isolation
    if (user.role !== 'SUPER_ADMIN') {
      query.organizationId = user.organizationId;
    } else if (organizationId) {
      query.organizationId = organizationId;
    }

    if (officeId) {
      query.officeId = officeId;
    }
    
    if (user.role === 'ADMIN') { const { hasPermission } = await import('@/lib/permissions'); if (!(await hasPermission(user.userId, 'MANAGE_STAFF'))) return NextResponse.json({ success: false, message: 'Forbidden: Missing MANAGE_STAFF permission' }, { status: 403 }); }
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
    const user = await getUserFromCookie();
    if (!user || user.role === 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    // RBAC
    if (user.role === 'ADMIN') {
      const { hasPermission } = await import('@/lib/permissions');
      const canManageStaff = await hasPermission(user.userId, 'MANAGE_STAFF');
      if (!canManageStaff) {
        return NextResponse.json({ success: false, message: 'Forbidden: Missing MANAGE_STAFF permission' }, { status: 403 });
      }
    }

    const body = await request.json();
    
    // Organization isolation
    const targetOrgId = user.role === 'SUPER_ADMIN' ? body.organizationId : user.organizationId;
    
    if (!targetOrgId) {
      return NextResponse.json({ success: false, message: 'Organization ID is required' }, { status: 400 });
    }
    
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'User with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    if (body.roleId) {
      const { Role } = await import('@/models/Role');
      const assignedRole = await Role.findById(body.roleId);
      if (assignedRole && (assignedRole.name === 'SUPER_ADMIN' || assignedRole.name === 'ADMIN')) {
         return NextResponse.json({ success: false, message: 'Forbidden: Cannot assign Admin/Super Admin roles through Staff API' }, { status: 403 });
      }
    }

    const newUser = await User.create({
      fullName: body.fullName,
      email: body.email,
      password: hashedPassword,
      role: UserRole.STAFF,
      organizationId: targetOrgId,
      officeId: body.officeId,
      counterId: body.counterId,
      serviceId: body.serviceId,
      roleId: body.roleId,
      employeeId: body.employeeId
    });

    if (body.counterId) {
      const { Counter } = await import('@/models/Counter');
      // If another staff had this counter, clear their assignment
      const previousStaff = await User.findOne({ counterId: body.counterId, _id: { $ne: newUser._id } });
      if (previousStaff) {
        await User.findByIdAndUpdate(previousStaff._id, { $set: { counterId: null } });
      }
      await Counter.findByIdAndUpdate(body.counterId, { $set: { staffId: newUser._id } });
    }

    await createAuditLog({
      action: 'CREATE',
      module: 'Staff',
      description: `Created new staff member: ${newUser.fullName}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'User',
      entityId: newUser._id.toString(),
      newData: newUser.toObject(),
      organizationId: targetOrgId,
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
