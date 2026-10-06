import { NextResponse } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Organization } from '@/models/Organization';
import { createAuditLog } from '@/lib/auditLogger';
import { hasPermission } from '@/lib/permissions';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();
    
    if (!user || user.role === 'CITIZEN' || user.role === 'STAFF') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const query: any = {};
    if (user.role === 'ADMIN') {
       query._id = user.organizationId;
    }

    if (user.role === 'ADMIN' && !(await hasPermission(user.userId, 'MANAGE_ORGANIZATIONS'))) return NextResponse.json({ success: false, message: 'Forbidden: Missing MANAGE_ORGANIZATIONS permission' }, { status: 403 });
    const orgs = await Organization.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: orgs });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const user = await getUserFromCookie();
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, message: 'Forbidden: Only SUPER_ADMIN can create organizations' }, { status: 403 });
    }

    const body = await request.json();
    
    const existing = await Organization.findOne({ code: body.code });
    if (existing) {
      return NextResponse.json({ success: false, message: 'Organization code already exists' }, { status: 400 });
    }

    const newOrg = await Organization.create({
      name: body.name,
      code: body.code,
      description: body.description,
      contactNumber: body.contactNumber,
      email: body.email,
      address: body.address,
      settings: {
        maxQueueSize: body.settings?.maxQueueSize || 100,
        noShowTimeout: body.settings?.noShowTimeout || 5,
        checkInBuffer: body.settings?.checkInBuffer || 15,
        smsEnabled: body.settings?.smsEnabled || false,
        emailEnabled: body.settings?.emailEnabled || false,
      }
    });

    await createAuditLog({
      action: 'CREATE',
      module: 'Organizations',
      description: `Created organization: ${newOrg.name}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'Organization',
      entityId: newOrg._id.toString(),
      newData: newOrg.toObject(),
      request,
    });

    return NextResponse.json({
      success: true,
      message: 'Organization created successfully',
      data: newOrg
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
