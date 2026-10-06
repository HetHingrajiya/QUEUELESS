import { NextResponse } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Organization } from '@/models/Organization';
import { createAuditLog } from '@/lib/auditLogger';
import { requirePermission } from '@/lib/rbac';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const orgs = await Organization.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: orgs });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    // Auth Check from headers set by middleware
    const user = await requirePermission('organizations', 'add');
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    
    const existing = await Organization.findOne({ code: body.code });
    if (existing) {
      return NextResponse.json({ success: false, message: 'Organization code already exists' }, { status: 400 });
    }

    const newOrg = await Organization.create(body);

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
