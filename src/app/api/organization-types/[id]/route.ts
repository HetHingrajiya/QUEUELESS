import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { OrganizationType } from '@/models/OrganizationType';
import { getUserFromCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const type = await OrganizationType.findById(resolvedParams.id);
    if (!type) {
      return NextResponse.json({ success: false, message: 'Organization Type not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: type });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const resolvedParams = await params;
    const body = await request.json();
    
    const oldType = await OrganizationType.findById(resolvedParams.id);
    if (!oldType) {
      return NextResponse.json({ success: false, message: 'Organization Type not found' }, { status: 404 });
    }

    const type = await OrganizationType.findByIdAndUpdate(resolvedParams.id, body, { new: true, runValidators: true });
    
    await createAuditLog({
      action: 'UPDATE',
      module: 'Organization Types',
      description: `Updated Organization Type: ${type.name}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'OrganizationType',
      entityId: type._id.toString(),
      oldData: oldType.toObject(),
      newData: type.toObject(),
      request,
    });
    
    return NextResponse.json({ success: true, data: type });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'Organization type with this name already exists' }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const resolvedParams = await params;
    const type = await OrganizationType.findByIdAndDelete(resolvedParams.id);
    
    if (!type) {
      return NextResponse.json({ success: false, message: 'Organization Type not found' }, { status: 404 });
    }

    await createAuditLog({
      action: 'DELETE',
      module: 'Organization Types',
      description: `Deleted Organization Type: ${type.name}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'OrganizationType',
      entityId: type._id.toString(),
      oldData: type.toObject(),
      request,
    });
    
    return NextResponse.json({ success: true, message: 'Organization Type deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
