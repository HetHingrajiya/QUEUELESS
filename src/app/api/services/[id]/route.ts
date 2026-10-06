import { NextResponse, NextRequest } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Service } from '@/models/Service';
import { createAuditLog } from '@/lib/auditLogger';
import { requirePermission } from '@/lib/rbac';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    
    const service = await Service.findById(id);
    
    const user = await getUserFromCookie();
    if (user && user.role !== 'CITIZEN') {
       const permittedUser = await requirePermission('services', 'view');
       if (!permittedUser) {
         return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
       }
    }
    
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
    const user = await requirePermission('services', 'modify');
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    
    const oldService = await Service.findById(id);
    if (!oldService) {
      return NextResponse.json({ success: false, message: 'Service not found' }, { status: 404 });
    }

    const updatedService = await Service.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedService) {
      return NextResponse.json({ success: false, message: 'Service not found' }, { status: 404 });
    }

    await createAuditLog({
      action: 'UPDATE',
      module: 'Services',
      description: `Updated service: ${updatedService.name}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'Service',
      entityId: id,
      oldData: oldService.toObject(),
      newData: updatedService.toObject(),
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
    const user = await requirePermission('services', 'delete');
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const oldService = await Service.findById(id);
    if (!oldService) {
      return NextResponse.json({ success: false, message: 'Service not found' }, { status: 404 });
    }

    const deletedService = await Service.findByIdAndDelete(id);

    if (!deletedService) {
      return NextResponse.json({ success: false, message: 'Service not found' }, { status: 404 });
    }

    await createAuditLog({
      action: 'DELETE',
      module: 'Services',
      description: `Deleted service: ${oldService.name}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'Service',
      entityId: id,
      oldData: oldService.toObject(),
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
