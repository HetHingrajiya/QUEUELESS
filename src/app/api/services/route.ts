import { NextResponse } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Service } from '@/models/Service';
import { createAuditLog } from '@/lib/auditLogger';
import { requirePermission } from '@/lib/rbac';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const officeId = url.searchParams.get('officeId');
    let query: any = officeId ? { officeId } : {};
    const user = await getUserFromCookie();
    
    // Auth Check for view access
    if (user && user.role !== 'CITIZEN') {
       const permittedUser = await requirePermission('services', 'view');
       if (!permittedUser) {
         return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
       }
    }
    if (user && user.role === 'ADMIN') {
      query.organizationId = user.organizationId;
    }
    
    const services = await Service.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: services });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    // Auth Check
    const user = await requirePermission('services', 'add');
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    
    const existingService = await Service.findOne({ code: body.code });
    if (existingService) {
      return NextResponse.json({ success: false, message: 'Service code already exists' }, { status: 400 });
    }

    const newService = await Service.create(body);

    await createAuditLog({
      action: 'CREATE',
      module: 'Services',
      description: `Created new service: ${newService.name}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'Service',
      entityId: newService._id.toString(),
      newData: newService.toObject(),
      request,
    });

    return NextResponse.json({
      success: true,
      message: 'Service created successfully',
      data: newService
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
