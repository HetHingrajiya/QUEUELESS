import { NextResponse, NextRequest } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Counter } from '@/models/Counter';
import { Office } from '@/models/Office';
import { createAuditLog } from '@/lib/auditLogger';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    
    // Auth Check
    const user = await getUserFromCookie();
    if (!user) {
       return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const counter = await Counter.findById(id).lean();
    if (!counter) {
      return NextResponse.json({ success: false, message: 'Counter not found' }, { status: 404 });
    }

    if (user.role === 'ADMIN' || user.role === 'STAFF') {
       const office = await Office.findById(counter.officeId).lean();
       if (!office || office.organizationId?.toString() !== user.organizationId) {
         return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
       }
    }

    return NextResponse.json({
      success: true,
      data: counter
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
    const currentUser = await getUserFromCookie();
    if (!currentUser || currentUser.role === 'CITIZEN' || currentUser.role === 'STAFF') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    // RBAC
    if (currentUser.role === 'ADMIN') {
      const { hasPermission } = await import('@/lib/permissions');
      const canManageOffices = await hasPermission(currentUser.userId, 'MANAGE_OFFICES');
      if (!canManageOffices) {
        return NextResponse.json({ success: false, message: 'Forbidden: Missing MANAGE_OFFICES permission' }, { status: 403 });
      }
    }

    const body = await req.json();
    
    const query: any = { _id: id };

    const oldCounter = await Counter.findOne(query);
    if (!oldCounter) {
      return NextResponse.json({ success: false, message: 'Counter not found or unauthorized' }, { status: 404 });
    }

    if (currentUser.role === 'ADMIN') {
       const office = await Office.findById(oldCounter.officeId).lean();
       if (!office || office.organizationId?.toString() !== currentUser.organizationId) {
         return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
       }
    }

    // Explicit field allowance
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.number !== undefined) updateData.number = body.number;
    if (body.officeId !== undefined) updateData.officeId = body.officeId;
    if (body.serviceIds !== undefined) updateData.serviceIds = body.serviceIds;
    else if (body.serviceId !== undefined) updateData.serviceIds = body.serviceId ? [body.serviceId] : [];
    if (body.staffId !== undefined) updateData.staffId = body.staffId;
    if (body.status !== undefined) updateData.status = body.status;

    if (currentUser.role === 'SUPER_ADMIN' && body.organizationId) {
       updateData.organizationId = body.organizationId;
    }

    // A counter can only be moved to an office in the same authorized organization.
    if (updateData.officeId !== undefined) {
      const targetOffice = await Office.findById(updateData.officeId).lean();
      if (!targetOffice) {
        return NextResponse.json({ success: false, message: 'Target office not found' }, { status: 404 });
      }
      if (currentUser.role === 'ADMIN' &&
          targetOffice.organizationId?.toString() !== currentUser.organizationId?.toString()) {
        return NextResponse.json({ success: false, message: 'Cannot move a counter outside your organization' }, { status: 403 });
      }
    }

    const { User } = await import('@/models/User');

    if (updateData.staffId !== undefined) {
      const newStaffId = updateData.staffId;
      
      if (newStaffId) {
        const newStaff = await User.findById(newStaffId);
        if (!newStaff) return NextResponse.json({ success: false, message: 'Assigned staff not found' }, { status: 404 });
        
        const expectedOfficeId = updateData.officeId || oldCounter.officeId;
        const expectedOffice = await Office.findById(expectedOfficeId).lean();
        const expectedOrgId = expectedOffice?.organizationId;
        
        if (newStaff.officeId?.toString() !== expectedOfficeId?.toString() || 
            newStaff.organizationId?.toString() !== expectedOrgId?.toString()) {
          return NextResponse.json({ success: false, message: 'Staff office or organization mismatch' }, { status: 400 });
        }
      }

      if (oldCounter.staffId && oldCounter.staffId.toString() !== newStaffId?.toString()) {
        await User.findByIdAndUpdate(oldCounter.staffId, { $set: { counterId: null } });
      }

      if (newStaffId) {
        const previousCounter = await Counter.findOne({ staffId: newStaffId });
        if (previousCounter && previousCounter._id.toString() !== id) {
          await Counter.findByIdAndUpdate(previousCounter._id, { $set: { staffId: null } });
        }
        await User.findByIdAndUpdate(newStaffId, { $set: { counterId: id } });
      }
    }

    const updatedCounter = await Counter.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedCounter) {
      return NextResponse.json({ success: false, message: 'Counter not found' }, { status: 404 });
    }

    await createAuditLog({
      action: 'UPDATE',
      module: 'Counters',
      description: `Updated counter: ${updatedCounter.name || updatedCounter.number}`,
      userId: currentUser.userId,
      userRole: currentUser.role,
      entityType: 'Counter',
      entityId: id,
      oldData: oldCounter.toObject(),
      newData: updatedCounter.toObject(),
      organizationId: oldCounter.organizationId,
      request: req,
    });

    return NextResponse.json({
      success: true,
      message: 'Counter updated successfully',
      data: updatedCounter
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
    const currentUser = await getUserFromCookie();
    if (!currentUser || currentUser.role === 'CITIZEN' || currentUser.role === 'STAFF') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    // RBAC
    if (currentUser.role === 'ADMIN') {
      const { hasPermission } = await import('@/lib/permissions');
      const canManageOffices = await hasPermission(currentUser.userId, 'MANAGE_OFFICES');
      if (!canManageOffices) {
        return NextResponse.json({ success: false, message: 'Forbidden: Missing MANAGE_OFFICES permission' }, { status: 403 });
      }
    }

    const query: any = { _id: id };

    const oldCounter = await Counter.findOne(query);
    if (!oldCounter) {
      return NextResponse.json({ success: false, message: 'Counter not found or unauthorized' }, { status: 404 });
    }

    if (currentUser.role === 'ADMIN') {
       const office = await Office.findById(oldCounter.officeId).lean();
       if (!office || office.organizationId?.toString() !== currentUser.organizationId) {
         return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
       }
    }

    const deletedCounter = await Counter.findOneAndDelete(query);

    if (!deletedCounter) {
      return NextResponse.json({ success: false, message: 'Counter not found' }, { status: 404 });
    }

    if (deletedCounter.staffId) {
      const { User } = await import('@/models/User');
      await User.findByIdAndUpdate(deletedCounter.staffId, { $set: { counterId: null } });
    }

    await createAuditLog({
      action: 'DELETE',
      module: 'Counters',
      description: `Deleted counter: ${oldCounter.name || oldCounter.number}`,
      userId: currentUser.userId,
      userRole: currentUser.role,
      entityType: 'Counter',
      entityId: id,
      oldData: oldCounter.toObject(),
      organizationId: oldCounter.organizationId,
      request: req,
    });

    return NextResponse.json({
      success: true,
      message: 'Counter deleted successfully'
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
