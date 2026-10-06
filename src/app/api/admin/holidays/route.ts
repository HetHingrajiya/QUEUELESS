import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Holiday } from '@/models/Holiday';
import { getUserFromCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();
    if (!user || user.role === 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const query: any = {};
    if (user.role !== 'SUPER_ADMIN') {
       query.organizationId = user.organizationId;
    }

    const holidays = await Holiday.find(query).sort({ date: 1 });
    return NextResponse.json({ success: true, data: holidays });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
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

    const body = await req.json();
    const { name, date, description, organizationId } = body;

    const targetOrgId = user.role === 'SUPER_ADMIN' ? organizationId : user.organizationId;

    if (!name || !date || !targetOrgId) {
      return NextResponse.json({ success: false, message: 'Name, date and organization ID are required' }, { status: 400 });
    }

    const newHoliday = await Holiday.create({
      name,
      date,
      description,
      organizationId: targetOrgId,
    });

    await createAuditLog({
      action: 'CREATE',
      module: 'Holidays',
      description: `Created holiday: ${newHoliday.name}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'Holiday',
      entityId: newHoliday._id.toString(),
      organizationId: targetOrgId,
      newData: newHoliday.toObject(),
      request: req,
    });

    return NextResponse.json({ success: true, data: newHoliday }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'A holiday already exists on this date' }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
