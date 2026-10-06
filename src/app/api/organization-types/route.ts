import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { OrganizationType } from '@/models/OrganizationType';
import { getUserFromCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';

export async function GET() {
  try {
    await dbConnect();
    const types = await OrganizationType.find({}).sort({ name: 1 });
    return NextResponse.json({ success: true, data: types });
  } catch (error) {
    console.error('Error fetching organization types:', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    }

    const type = await OrganizationType.create({
      name: body.name,
      description: body.description,
      isActive: body.isActive !== undefined ? body.isActive : true
    });

    await createAuditLog({
      action: 'CREATE',
      module: 'Organization Types',
      description: `Created Organization Type: ${type.name}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'OrganizationType',
      entityId: type._id.toString(),
      newData: type.toObject(),
      request,
    });

    return NextResponse.json({ success: true, data: type }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating organization type:', error);
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'Organization type with this name already exists' }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
