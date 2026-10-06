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
    if (!user || user.role === 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const query: any = {};
    if (officeId) query.officeId = officeId;
    
    if (user.role === 'SUPER_ADMIN' && organizationId) {
      query.organizationId = organizationId;
    } else if (user.role !== 'SUPER_ADMIN') {
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
    if (!user || user.role === 'CITIZEN' || user.role === 'STAFF') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    // RBAC
    if (user.role === 'ADMIN') {
      const { hasPermission } = await import('@/lib/permissions');
      const canManageSettings = await hasPermission(user.userId, 'MANAGE_SETTINGS');
      if (!canManageSettings) {
        return NextResponse.json({ success: false, message: 'Forbidden: Missing MANAGE_SETTINGS permission' }, { status: 403 });
      }
    }

    const body = await request.json();
    
    // Organization isolation
    const targetOrgId = user.role === 'SUPER_ADMIN' ? body.organizationId : user.organizationId;
    if (!targetOrgId) {
       return NextResponse.json({ success: false, message: 'Organization ID is required' }, { status: 400 });
    }

    const newRule = await PriorityRule.create({
      name: body.name,
      description: body.description,
      priorityMultiplier: body.priorityMultiplier,
      status: body.status || 'ACTIVE',
      organizationId: targetOrgId,
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
      organizationId: targetOrgId,
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
