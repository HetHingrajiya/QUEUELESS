import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Organization } from '@/models/Organization';
import { getUserFromCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const org = await Organization.findById(resolvedParams.id);
    if (!org) {
      return NextResponse.json({ success: false, message: 'Organization not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: org });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    
    // Auth Check
    const user = await getUserFromCookie();
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    
    const oldOrg = await Organization.findById(resolvedParams.id);
    if (!oldOrg) {
      return NextResponse.json({ success: false, message: 'Organization not found' }, { status: 404 });
    }

    const org = await Organization.findByIdAndUpdate(resolvedParams.id, body, { new: true, runValidators: true });
    
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
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    
    // Auth Check
    const user = await getUserFromCookie();
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const oldOrg = await Organization.findById(resolvedParams.id);
    if (!oldOrg) {
      return NextResponse.json({ success: false, message: 'Organization not found' }, { status: 404 });
    }

    const org = await Organization.findByIdAndDelete(resolvedParams.id);
    
    if (!org) {
      return NextResponse.json({ success: false, message: 'Organization not found' }, { status: 404 });
    }
    
    await createAuditLog({
      action: 'DELETE',
      module: 'Organizations',
      description: `Deleted organization: ${oldOrg.name}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'Organization',
      entityId: resolvedParams.id,
      oldData: oldOrg.toObject(),
      request,
    });

    return NextResponse.json({ success: true, message: 'Organization deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
