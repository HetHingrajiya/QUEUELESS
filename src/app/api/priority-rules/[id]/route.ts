import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import { PriorityRule } from '@/models/PriorityRule';
import { getUserFromCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const user = await getUserFromCookie();
    if (!user || user.role === 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const rule = await PriorityRule.findById(id);
    if (!rule) {
      return NextResponse.json({ success: false, message: 'Rule not found' }, { status: 404 });
    }
    
    if (user.role === 'ADMIN' || user.role === 'STAFF') {
       if (rule.organizationId.toString() !== user.organizationId) {
          return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
       }
    }

    return NextResponse.json({ success: true, data: rule });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    
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

    const oldRule = await PriorityRule.findById(id);
    if (!oldRule) {
      return NextResponse.json({ success: false, message: 'Rule not found' }, { status: 404 });
    }

    if (user.role === 'ADMIN' && oldRule.organizationId.toString() !== user.organizationId) {
       return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    
    const updateData = {
      name: body.name,
      description: body.description,
      priorityMultiplier: body.priorityMultiplier,
      status: body.status,
      officeId: body.officeId || undefined
    };
    
    // Only SUPER_ADMIN can change the org
    if (user.role === 'SUPER_ADMIN' && body.organizationId) {
      (updateData as any).organizationId = body.organizationId;
    }

    const updatedRule = await PriorityRule.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    );

    await createAuditLog({
      action: 'UPDATE',
      module: 'PriorityRules',
      description: `Updated priority rule: ${updatedRule.name}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'PriorityRule',
      entityId: id,
      oldData: oldRule.toObject(),
      newData: updatedRule.toObject(),
      organizationId: oldRule.organizationId,
      request: req,
    });

    return NextResponse.json({ success: true, message: 'Rule updated successfully', data: updatedRule });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    
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

    const oldRule = await PriorityRule.findById(id);
    if (!oldRule) {
      return NextResponse.json({ success: false, message: 'Rule not found' }, { status: 404 });
    }
    
    if (user.role === 'ADMIN' && oldRule.organizationId.toString() !== user.organizationId) {
       return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await PriorityRule.findByIdAndDelete(id);

    await createAuditLog({
      action: 'DELETE',
      module: 'PriorityRules',
      description: `Deleted priority rule: ${oldRule.name}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'PriorityRule',
      entityId: id,
      oldData: oldRule.toObject(),
      organizationId: oldRule.organizationId,
      request: req,
    });

    return NextResponse.json({ success: true, message: 'Rule deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
