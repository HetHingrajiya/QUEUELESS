import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Holiday } from '@/models/Holiday';
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

    const query: any = { _id: id };
    if (user.role !== 'SUPER_ADMIN') {
       query.organizationId = user.organizationId;
    }

    const holiday = await Holiday.findOne(query);
    if (!holiday) {
      return NextResponse.json({ success: false, message: 'Holiday not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: holiday });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
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

    const body = await req.json();
    const { name, date, description } = body;

    const query: any = { _id: id };
    if (user.role === 'ADMIN') {
       query.organizationId = user.organizationId;
    }

    const oldHoliday = await Holiday.findOne(query);
    if (!oldHoliday) {
       return NextResponse.json({ success: false, message: 'Holiday not found' }, { status: 404 });
    }

    const updateData: any = { name, date, description };

    if (user.role === 'SUPER_ADMIN' && body.organizationId) {
       updateData.organizationId = body.organizationId;
    }

    const updated = await Holiday.findOneAndUpdate(
      query,
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    );

    await createAuditLog({
      action: 'UPDATE',
      module: 'Holidays',
      description: `Updated holiday: ${updated.name}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'Holiday',
      entityId: id,
      oldData: oldHoliday.toObject(),
      newData: updated.toObject(),
      organizationId: oldHoliday.organizationId,
      request: req,
    });
    
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Holiday not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'A holiday already exists on this date' }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
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

    const query: any = { _id: id };
    if (user.role === 'ADMIN') {
       query.organizationId = user.organizationId;
    }

    const oldHoliday = await Holiday.findOne(query);
    if (!oldHoliday) {
       return NextResponse.json({ success: false, message: 'Holiday not found' }, { status: 404 });
    }

    const deleted = await Holiday.findOneAndDelete(query);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Holiday not found' }, { status: 404 });
    }

    await createAuditLog({
      action: 'DELETE',
      module: 'Holidays',
      description: `Deleted holiday: ${oldHoliday.name}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'Holiday',
      entityId: id,
      oldData: oldHoliday.toObject(),
      organizationId: oldHoliday.organizationId,
      request: req,
    });

    return NextResponse.json({ success: true, message: 'Holiday deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
