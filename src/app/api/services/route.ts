import { NextResponse } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Service } from '@/models/Service';
import { Office } from '@/models/Office';
import { createAuditLog } from '@/lib/auditLogger';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const officeId = url.searchParams.get('officeId');
    const orgId = url.searchParams.get('organizationId');
    let query: any = officeId ? { officeId } : {};
    
    const user = await getUserFromCookie();
    
    // Auth Check
    if (!user) {
       return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (user.role === 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    if (user.role === 'ADMIN' || user.role === 'STAFF') {
      if (!user.organizationId) {
        return NextResponse.json({ success: false, message: 'Organization assignment required' }, { status: 403 });
      }
      const offices = await Office.find({ organizationId: user.organizationId }).select('_id').lean();
      const officeIds = offices.map((office) => office._id);
      query.officeId = officeId
        ? { $in: officeIds.filter((id) => id.toString() === officeId) }
        : { $in: officeIds };
    } else if (user.role === 'SUPER_ADMIN' && orgId) {
      const offices = await Office.find({ organizationId: orgId }).select('_id').lean();
      const officeIds = offices.map((office) => office._id);
      query.officeId = officeId
        ? { $in: officeIds.filter((id) => id.toString() === officeId) }
        : { $in: officeIds };
    } else if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
    
    if (user.role === 'ADMIN') { const { hasPermission } = await import('@/lib/permissions'); if (!(await hasPermission(user.userId, 'MANAGE_SERVICES'))) return NextResponse.json({ success: false, message: 'Forbidden: Missing MANAGE_SERVICES permission' }, { status: 403 }); }
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
    const user = await getUserFromCookie();
    if (!user || user.role === 'CITIZEN' || user.role === 'STAFF') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    // RBAC
    if (user.role === 'ADMIN') {
      const { hasPermission } = await import('@/lib/permissions');
      const canManageServices = await hasPermission(user.userId, 'MANAGE_SERVICES');
      if (!canManageServices) {
        return NextResponse.json({ success: false, message: 'Forbidden: Missing MANAGE_SERVICES permission' }, { status: 403 });
      }
    }

    const body = await request.json();
    
    // Organization isolation
    const targetOrgId = user.role === 'SUPER_ADMIN' ? body.organizationId : user.organizationId;
    if (!targetOrgId) {
       return NextResponse.json({ success: false, message: 'Organization ID is required' }, { status: 400 });
    }
    
    const office = await Office.findById(body.officeId).lean();
    if (!office || office.organizationId?.toString() !== targetOrgId.toString()) {
      return NextResponse.json({ success: false, message: 'Office does not belong to the selected organization' }, { status: 403 });
    }

    const existingService = await Service.findOne({ code: body.code, officeId: body.officeId });
    if (existingService) {
      return NextResponse.json({ success: false, message: 'Service code already exists in this organization' }, { status: 400 });
    }

    // Explicit field allowance
    const newService = await Service.create({
      name: body.name,
      code: body.code,
      description: body.description,
      department: body.department,
      organizationId: targetOrgId,
      officeId: body.officeId,
      estimatedTime: body.estimatedTime,
      documentsRequired: body.documentsRequired || [],
      status: body.status || 'ACTIVE',
      prefix: body.prefix
    });

    await createAuditLog({
      action: 'CREATE',
      module: 'Services',
      description: `Created new service: ${newService.name}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'Service',
      entityId: newService._id.toString(),
      organizationId: targetOrgId,
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
