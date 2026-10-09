import { NextResponse } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Counter } from '@/models/Counter';
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
    
    if (user.role === 'ADMIN') { const { hasPermission } = await import('@/lib/permissions'); if (!(await hasPermission(user.userId, 'MANAGE_OFFICES'))) return NextResponse.json({ success: false, message: 'Forbidden: Missing MANAGE_OFFICES permission' }, { status: 403 }); }
    const counters = await Counter.find(query).populate('officeId').populate('serviceIds').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: counters });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    // Auth Check from cookie
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

    if (!body.officeId) {
      return NextResponse.json({ success: false, message: 'Office ID is required' }, { status: 400 });
    }

    // Check for duplicate counter number in the same office
    const office = await Office.findById(body.officeId).lean();
    if (!office || office.organizationId?.toString() !== targetOrgId.toString()) {
      return NextResponse.json({ success: false, message: 'Office does not belong to the selected organization' }, { status: 403 });
    }

    if (body.staffId) {
      const { User, UserRole } = await import('@/models/User');
      const staff = await User.findById(body.staffId).lean();
      if (!staff || staff.role !== UserRole.STAFF || staff.status !== 'ACTIVE' ||
          staff.officeId?.toString() !== body.officeId.toString() ||
          staff.organizationId?.toString() !== targetOrgId.toString()) {
        return NextResponse.json({ success: false, message: 'Assigned user must be active staff in this office and organization' }, { status: 400 });
      }
    }

    const existingCounter = await Counter.findOne({ number: body.number, officeId: body.officeId });
    if (existingCounter) {
      return NextResponse.json({ 
        success: false, 
        message: 'Counter number already exists in this office',
        errorCode: 'COUNTER_EXISTS'
      }, { status: 400 });
    }

    const newCounter = await Counter.create({
      number: body.number,
      name: body.name,
      officeId: body.officeId,
      serviceIds: body.serviceIds || (body.serviceId ? [body.serviceId] : []),
      staffId: body.staffId || null,
      status: body.status || 'OFFLINE'
    });

    if (body.staffId) {
      const { User } = await import('@/models/User');
      
      // If the staff was assigned to another counter, clear it there
      const previousCounter = await Counter.findOne({ staffId: body.staffId, _id: { $ne: newCounter._id } });
      if (previousCounter) {
        await Counter.findByIdAndUpdate(previousCounter._id, { $set: { staffId: null } });
      }
      
      await User.findByIdAndUpdate(body.staffId, { $set: { counterId: newCounter._id } });
    }

    await createAuditLog({
      action: 'CREATE',
      module: 'Counters',
      description: `Created new counter: ${newCounter.name || newCounter.number}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'Counter',
      entityId: newCounter._id.toString(),
      organizationId: targetOrgId,
      newData: newCounter.toObject(),
      request,
    });

    return NextResponse.json({
      success: true,
      message: 'Counter created successfully',
      data: newCounter
    });

  } catch (error) {
    console.error('Create counter error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
