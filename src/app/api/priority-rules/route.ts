import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { PriorityRule } from '@/models/PriorityRule';
import { getUserFromCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    const officeId = url.searchParams.get('officeId');
    
    // Auth Check
    const user = await getUserFromCookie();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const query: any = {};
    if (organizationId) query.organizationId = organizationId;
    if (officeId) query.officeId = officeId;
    
    if (user.role === 'ADMIN') {
       query.organizationId = user.organizationId;
    }
    
    const rules = await PriorityRule.find(query)
      .populate('organizationId')
      .populate('officeId')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: rules });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    // Auth Check
    const user = await getUserFromCookie();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    
    if (user.role === 'ADMIN' && body.organizationId !== user.organizationId) {
      return NextResponse.json({ success: false, message: 'Unauthorized organization' }, { status: 403 });
    }

    const newRule = await PriorityRule.create({
      name: body.name,
      description: body.description,
      priorityMultiplier: body.priorityMultiplier,
      status: body.status || 'ACTIVE',
      organizationId: body.organizationId || user.organizationId,
      officeId: body.officeId
    });

    await createAuditLog({
      action: 'CREATE',
      module: 'PriorityRules',
      description: `Created priority rule: ${newRule.name}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'PriorityRule',
      entityId: newRule._id.toString(),
      newData: newRule.toObject(),
      request,
    });

    return NextResponse.json({
      success: true,
      message: 'Priority rule created successfully',
      data: newRule
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
