import { NextResponse, NextRequest } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Service } from '@/models/Service';
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

    const query: any = { _id: id };
    
    if (user.role === 'ADMIN' || user.role === 'STAFF') {
       query.organizationId = user.organizationId;
    }
    
    const service = await Service.findOne(query);
    
    if (!service) {
      return NextResponse.json({ success: false, message: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: service
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
      const canManageServices = await hasPermission(currentUser.userId, 'MANAGE_SERVICES');
      if (!canManageServices) {
        return NextResponse.json({ success: false, message: 'Forbidden: Missing MANAGE_SERVICES permission' }, { status: 403 });
      }
    }

    const body = await req.json();
    
    const query: any = { _id: id };
    if (currentUser.role === 'ADMIN') {
       query.organizationId = currentUser.organizationId;
    }

    const oldService = await Service.findOne(query);
    if (!oldService) {
      return NextResponse.json({ success: false, message: 'Service not found or unauthorized' }, { status: 404 });
    }

    // Explicit field allowance
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.code !== undefined) updateData.code = body.code;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.department !== undefined) updateData.department = body.department;
    if (body.officeId !== undefined) updateData.officeId = body.officeId;
    if (body.estimatedTime !== undefined) updateData.estimatedTime = body.estimatedTime;
    if (body.documentsRequired !== undefined) updateData.documentsRequired = body.documentsRequired;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.prefix !== undefined) updateData.prefix = body.prefix;

    if (currentUser.role === 'SUPER_ADMIN' && body.organizationId) {
       updateData.organizationId = body.organizationId;
    }

    if (updateData.officeId !== undefined || updateData.organizationId !== undefined) {
      const targetOfficeId = updateData.officeId ?? oldService.officeId;
      const targetOffice = await Office.findById(targetOfficeId).lean();
      if (!targetOffice) {
        return NextResponse.json({ success: false, message: 'Target office not found' }, { status: 404 });
      }
      const expectedOrganizationId = updateData.organizationId ?? oldService.organizationId;
      if (targetOffice.organizationId?.toString() !== expectedOrganizationId?.toString()) {
        return NextResponse.json({ success: false, message: 'Service office must belong to the same organization' }, { status: 400 });
      }
      if (currentUser.role === 'ADMIN' &&
          targetOffice.organizationId?.toString() !== currentUser.organizationId?.toString()) {
        return NextResponse.json({ success: false, message: 'Cannot move a service outside your organization' }, { status: 403 });
      }
    }

    const updatedService = await Service.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedService) {
      return NextResponse.json({ success: false, message: 'Service not found' }, { status: 404 });
    }

    await createAuditLog({
      action: 'UPDATE',
      module: 'Services',
      description: `Updated service: ${updatedService.name}`,
      userId: currentUser.userId,
      userRole: currentUser.role,
      entityType: 'Service',
      entityId: id,
      oldData: oldService.toObject(),
      newData: updatedService.toObject(),
      organizationId: oldService.organizationId,
      request: req,
    });

    return NextResponse.json({
      success: true,
      message: 'Service updated successfully',
      data: updatedService
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
      const canManageServices = await hasPermission(currentUser.userId, 'MANAGE_SERVICES');
      if (!canManageServices) {
        return NextResponse.json({ success: false, message: 'Forbidden: Missing MANAGE_SERVICES permission' }, { status: 403 });
      }
    }

    const query: any = { _id: id };
    if (currentUser.role === 'ADMIN') {
       query.organizationId = currentUser.organizationId;
    }

    const oldService = await Service.findOne(query);
    if (!oldService) {
      return NextResponse.json({ success: false, message: 'Service not found or unauthorized' }, { status: 404 });
    }

    const deletedService = await Service.findOneAndDelete(query);

    if (!deletedService) {
      return NextResponse.json({ success: false, message: 'Service not found' }, { status: 404 });
    }

    await createAuditLog({
      action: 'DELETE',
      module: 'Services',
      description: `Deleted service: ${oldService.name}`,
      userId: currentUser.userId,
      userRole: currentUser.role,
      entityType: 'Service',
      entityId: id,
      oldData: oldService.toObject(),
      organizationId: oldService.organizationId,
      request: req,
    });

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully'
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
