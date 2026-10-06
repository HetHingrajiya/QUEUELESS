import { NextResponse, NextRequest } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User, UserRole } from '@/models/User';
import bcrypt from 'bcryptjs';
import { createAuditLog } from '@/lib/auditLogger';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    
    // Auth Check
    const user = await getUserFromCookie();
    if (!user || user.role === 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    const query: any = { _id: id, role: UserRole.STAFF };
    
    if (user.role === 'ADMIN') {
      if (!user.organizationId) {
         return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
      }
      query.organizationId = user.organizationId;
    } else if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const staff = await User.findOne(query).populate('officeId').populate('counterId').populate('serviceId');
    
    if (!staff) {
      return NextResponse.json({ success: false, message: 'Staff not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: staff
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

    const body = await req.json();
    
    const query: any = { _id: id, role: UserRole.STAFF };
    if (user.role === 'ADMIN') {
       query.organizationId = user.organizationId;
    }

    const oldStaff = await User.findOne(query);
    if (!oldStaff) {
      return NextResponse.json({ success: false, message: 'Staff not found or unauthorized' }, { status: 404 });
    }

    // Explicit field allowance (Prevent Mass Assignment)
    const updateData: any = {};
    if (body.fullName !== undefined) updateData.fullName = body.fullName;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.mobile !== undefined) updateData.mobile = body.mobile;
    if (body.officeId !== undefined) updateData.officeId = body.officeId;
    if (body.counterId !== undefined) updateData.counterId = body.counterId;
    if (body.serviceId !== undefined) updateData.serviceId = body.serviceId;
    if (body.roleId !== undefined) {
      const { Role } = await import('@/models/Role');
      const assignedRole = await Role.findById(body.roleId);
      if (assignedRole && (assignedRole.name === 'SUPER_ADMIN' || assignedRole.name === 'ADMIN')) {
         return NextResponse.json({ success: false, message: 'Forbidden: Cannot assign Admin/Super Admin roles through Staff API' }, { status: 403 });
      }
      updateData.roleId = body.roleId;
    }
    if (body.employeeId !== undefined) updateData.employeeId = body.employeeId;
    if (body.status !== undefined) updateData.status = body.status;
    
    // SUPER_ADMIN can change org
    if (user.role === 'SUPER_ADMIN' && body.organizationId) {
      updateData.organizationId = body.organizationId;
    }

    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 10);
    }

    const { Counter } = await import('@/models/Counter');

    // Handle counter assignment synchronization
    if (updateData.counterId !== undefined) {
      const newCounterId = updateData.counterId;
      
      // If setting a new counter, validate office/org
      if (newCounterId) {
        const newCounter = await Counter.findById(newCounterId);
        if (!newCounter) {
          return NextResponse.json({ success: false, message: 'Assigned counter not found' }, { status: 404 });
        }
        const expectedOfficeId = updateData.officeId || oldStaff.officeId;
        const expectedOrgId = updateData.organizationId || oldStaff.organizationId;
        
        if (newCounter.officeId.toString() !== expectedOfficeId?.toString() || 
            newCounter.organizationId.toString() !== expectedOrgId?.toString()) {
          return NextResponse.json({ success: false, message: 'Counter office or organization mismatch' }, { status: 400 });
        }
      }

      // If the staff had an old counter that is DIFFERENT from the new one, release the old one
      if (oldStaff.counterId && oldStaff.counterId.toString() !== newCounterId?.toString()) {
        await Counter.findByIdAndUpdate(oldStaff.counterId, { $set: { staffId: null } });
      }

      // If there is a new counter, set its staffId to this staff (and steal it from whoever had it before)
      if (newCounterId) {
        // Find if another staff had this counter and remove it from them
        const previousStaff = await User.findOne({ counterId: newCounterId, role: 'STAFF' });
        if (previousStaff && previousStaff._id.toString() !== id) {
          await User.findByIdAndUpdate(previousStaff._id, { $set: { counterId: null } });
        }
        await Counter.findByIdAndUpdate(newCounterId, { $set: { staffId: id } });
      }
    }

    const updatedStaff = await User.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedStaff) {
      return NextResponse.json({ success: false, message: 'Staff not found' }, { status: 404 });
    }

    await createAuditLog({
      action: 'UPDATE',
      module: 'Staff',
      description: `Updated staff member: ${updatedStaff.fullName}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'User',
      entityId: id,
      oldData: oldStaff.toObject(),
      newData: updatedStaff.toObject(),
      organizationId: oldStaff.organizationId,
      request: req,
    });

    return NextResponse.json({
      success: true,
      message: 'Staff updated successfully',
      data: updatedStaff
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

    const query: any = { _id: id, role: UserRole.STAFF };
    if (user.role === 'ADMIN') {
       query.organizationId = user.organizationId;
    }

    const oldStaff = await User.findOne(query);
    if (!oldStaff) {
      return NextResponse.json({ success: false, message: 'Staff not found or unauthorized' }, { status: 404 });
    }

    const deletedStaff = await User.findOneAndDelete(query);

    if (!deletedStaff) {
      return NextResponse.json({ success: false, message: 'Staff not found' }, { status: 404 });
    }

    if (deletedStaff.counterId) {
      const { Counter } = await import('@/models/Counter');
      await Counter.findByIdAndUpdate(deletedStaff.counterId, { $set: { staffId: null } });
    }

    await createAuditLog({
      action: 'DELETE',
      module: 'Staff',
      description: `Deleted staff member: ${oldStaff.fullName}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'User',
      entityId: id,
      oldData: oldStaff.toObject(),
      organizationId: oldStaff.organizationId,
      request: req,
    });

    return NextResponse.json({
      success: true,
      message: 'Staff deleted successfully'
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
