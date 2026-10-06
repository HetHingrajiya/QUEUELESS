import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Office } from '@/models/Office';
import { getUserFromCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const orgId = url.searchParams.get('organizationId');
    let query: any = {};
    
    const user = await getUserFromCookie();
    
    // Auth Check
    if (!user) {
       return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (user.role === 'ADMIN' || user.role === 'STAFF') {
      query = { organizationId: user.organizationId };
    } else if (orgId) {
      query = { organizationId: orgId };
    }
    
    if (user.role === 'ADMIN') { const { hasPermission } = await import('@/lib/permissions'); if (!(await hasPermission(user.userId, 'MANAGE_OFFICES'))) return NextResponse.json({ success: false, message: 'Forbidden: Missing MANAGE_OFFICES permission' }, { status: 403 }); }
    const offices = await Office.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: offices });
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
      const canManageOffices = await hasPermission(user.userId, 'MANAGE_OFFICES');
      if (!canManageOffices) {
        return NextResponse.json({ success: false, message: 'Forbidden: Missing MANAGE_OFFICES permission' }, { status: 403 });
      }
    }

    const body = await request.json();
    
    // Organization isolation
    const targetOrgId = user.role === 'SUPER_ADMIN' ? body.organizationId : user.organizationId;
    if (!targetOrgId) {
       return NextResponse.json({ success: false, message: 'Organization ID is required' }, { status: 400 });
    }

    const existingOffice = await Office.findOne({ code: body.code });
    if (existingOffice) {
      return NextResponse.json({ success: false, message: 'Office code already exists' }, { status: 400 });
    }

    // Explicit field allowance
    const newOffice = await Office.create({
      name: body.name,
      code: body.code,
      organizationId: targetOrgId,
      address: body.address,
      city: body.city,
      state: body.state,
      pincode: body.pincode,
      email: body.email,
      phone: body.phone,
      status: body.status || 'ACTIVE'
    });

    await createAuditLog({
      action: 'CREATE',
      module: 'Offices',
      description: `Created new office: ${newOffice.name}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'Office',
      entityId: newOffice._id.toString(),
      organizationId: targetOrgId,
      newData: newOffice.toObject(),
      request,
    });

    return NextResponse.json({
      success: true,
      message: 'Office created successfully',
      data: newOffice
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
