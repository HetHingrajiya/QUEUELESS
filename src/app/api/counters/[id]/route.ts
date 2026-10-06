import { NextResponse, NextRequest } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Counter } from '@/models/Counter';
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

    const query: any = { _id: id };
    
    if (user.role === 'ADMIN' || user.role === 'STAFF') {
       query.organizationId = user.organizationId;
    }
    
    const counter = await Counter.findOne(query);
    
    if (!counter) {
      return NextResponse.json({ success: false, message: 'Counter not found' }, { status: 404 });
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
    if (currentUser.role === 'ADMIN') {
       query.organizationId = currentUser.organizationId;
    }

    const oldCounter = await Counter.findOne(query);
    if (!oldCounter) {
      return NextResponse.json({ success: false, message: 'Counter not found or unauthorized' }, { status: 404 });
    }

    // Explicit field allowance
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.number !== undefined) updateData.number = body.number;
    if (body.officeId !== undefined) updateData.officeId = body.officeId;
    if (body.serviceId !== undefined) updateData.serviceId = body.serviceId;
    if (body.staffId !== undefined) updateData.staffId = body.staffId;
    if (body.status !== undefined) updateData.status = body.status;

    if (currentUser.role === 'SUPER_ADMIN' && body.organizationId) {
       updateData.organizationId = body.organizationId;
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
    if (currentUser.role === 'ADMIN') {
       query.organizationId = currentUser.organizationId;
    }

    const oldCounter = await Counter.findOne(query);
    if (!oldCounter) {
      return NextResponse.json({ success: false, message: 'Counter not found or unauthorized' }, { status: 404 });
    }

    const deletedCounter = await Counter.findOneAndDelete(query);

    if (!deletedCounter) {
      return NextResponse.json({ success: false, message: 'Counter not found' }, { status: 404 });
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
