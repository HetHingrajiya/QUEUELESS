import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Organization } from '@/models/Organization';
import { getUserFromCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';
import { requirePermission } from '@/lib/rbac';
import mongoose from 'mongoose';

const ADMIN_EDITABLE_FIELDS = new Set(['name', 'description', 'contactNumber', 'email', 'address']);
const ADMIN_SETTING_FIELDS = new Set(['maxQueueSize', 'noShowTimeout', 'checkInBuffer', 'smsEnabled', 'emailEnabled']);

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid organization ID' }, { status: 400 });
    }
    if (user.role === 'ADMIN' && user.organizationId?.toString() !== id) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const org = await Organization.findById(id).lean();
    if (!org) {
      return NextResponse.json({ success: false, message: 'Organization not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: org });
  } catch (error) {
    console.error('Organization GET error:', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const user = await requirePermission('organizations', 'modify');
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid organization ID' }, { status: 400 });
    }
    if (user.role === 'ADMIN' && user.organizationId?.toString() !== id) {
      return NextResponse.json({ success: false, message: 'Forbidden: You can only update your own organization' }, { status: 403 });
    }

    const body = await request.json();
    const oldOrg = await Organization.findById(id);
    if (!oldOrg) {
      return NextResponse.json({ success: false, message: 'Organization not found' }, { status: 404 });
    }

    const updateQuery: any = { $set: {}, $unset: {} };
    for (const [key, value] of Object.entries(body || {})) {
      if (key === 'settings' && value && typeof value === 'object' && !Array.isArray(value)) {
        for (const [settingKey, settingValue] of Object.entries(value as Record<string, unknown>)) {
          if (!ADMIN_SETTING_FIELDS.has(settingKey)) continue;
          if (settingValue === null) {
            updateQuery.$unset[`settings.${settingKey}`] = 1;
          } else {
            updateQuery.$set[`settings.${settingKey}`] = settingValue;
          }
        }
        continue;
      }

      if (!ADMIN_EDITABLE_FIELDS.has(key)) continue;
      if (value === null) {
        updateQuery.$unset[key] = 1;
      } else {
        updateQuery.$set[key] = value;
      }
    }

    if (Object.keys(updateQuery.$set).length === 0) delete updateQuery.$set;
    if (Object.keys(updateQuery.$unset).length === 0) delete updateQuery.$unset;

    if (!updateQuery.$set && !updateQuery.$unset) {
      return NextResponse.json({ success: false, message: 'No editable fields supplied' }, { status: 400 });
    }

    const org = await Organization.findByIdAndUpdate(id, updateQuery, {
      new: true,
      runValidators: true,
    });

    if (!org) {
      return NextResponse.json({ success: false, message: 'Organization not found' }, { status: 404 });
    }

    await createAuditLog({
      action: 'UPDATE',
      module: 'Organizations',
      description: `Updated organization: ${org.name}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'Organization',
      entityId: org._id.toString(),
      oldData: oldOrg.toObject(),
      newData: org.toObject(),
      request,
    });

    return NextResponse.json({ success: true, data: org });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'Organization with this code already exists' }, { status: 400 });
    }
    console.error('Organization PUT error:', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const user = await requirePermission('organizations', 'delete');
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid organization ID' }, { status: 400 });
    }

    const oldOrg = await Organization.findById(id);
    if (!oldOrg) {
      return NextResponse.json({ success: false, message: 'Organization not found' }, { status: 404 });
    }

    await oldOrg.deleteOne();

    await createAuditLog({
      action: 'DELETE',
      module: 'Organizations',
      description: `Deleted organization: ${oldOrg.name}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'Organization',
      entityId: id,
      oldData: oldOrg.toObject(),
      request,
    });

    return NextResponse.json({ success: true, message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Organization DELETE error:', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
