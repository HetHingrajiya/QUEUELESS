import { NextResponse } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Counter } from '@/models/Counter';
import { createAuditLog } from '@/lib/auditLogger';
import { requirePermission } from '@/lib/rbac';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const officeId = url.searchParams.get('officeId');
    let query: any = officeId ? { officeId } : {};
    
    const user = await getUserFromCookie();
    if (user && user.role === 'ADMIN') {
      // In real scenario, filter by org
    }
    
    const counters = await Counter.find(query).populate('officeId').populate('serviceId').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: counters });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    // Auth Check from cookie
    const user = await requirePermission('counters', 'add');
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    
    // In a real app, use the officeId from the authenticated Admin token, 
    // but allow Super Admin to pass officeId in body.
    const finalOfficeId = user.role === 'ADMIN' && user.officeId ? user.officeId : body.officeId;

    if (!finalOfficeId) {
      return NextResponse.json({ success: false, message: 'Office ID is required' }, { status: 400 });
    }

    // Check for duplicate counter number in the same office
    const existingCounter = await Counter.findOne({ number: body.number, officeId: finalOfficeId });
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
      officeId: finalOfficeId,
      serviceId: body.serviceId,
      staffId: body.staffId || null,
      status: body.status || 'OFFLINE'
    });

    await createAuditLog({
      action: 'CREATE',
      module: 'Counters',
      description: `Created new counter: ${newCounter.name || newCounter.number}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'Counter',
      entityId: newCounter._id.toString(),
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
