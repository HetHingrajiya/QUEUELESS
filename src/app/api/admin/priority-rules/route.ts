import { NextResponse, NextRequest } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { PriorityRule } from '@/models/PriorityRule';
import { User, UserRole } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const user = await getUserFromCookie();
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const adminUser = await User.findById(user.userId).lean();
    if (!adminUser) {
      return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });
    }

    let query: any = {};
    if (user.role === UserRole.ADMIN && adminUser.organizationId) {
      query.organizationId = adminUser.organizationId;
    } else if (user.role === UserRole.ADMIN) {
      return NextResponse.json({ success: true, data: [] });
    }

    const rules = await PriorityRule.find(query).sort({ priorityMultiplier: -1, createdAt: -1 }).lean();

    return NextResponse.json({ success: true, data: rules });
  } catch (error: any) {
    console.error('Fetch Priority Rules Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const user = await getUserFromCookie();
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const adminUser = await User.findById(user.userId).lean();
    if (!adminUser || !adminUser.organizationId) {
      return NextResponse.json({ success: false, message: 'Admin has no organization assigned' }, { status: 400 });
    }

    const body = await req.json();
    const { name, description, priorityMultiplier, status } = body;

    if (!name || !description) {
      return NextResponse.json({ success: false, message: 'Name and description are required' }, { status: 400 });
    }

    const rule = await PriorityRule.create({
      name,
      description,
      priorityMultiplier: Number(priorityMultiplier) || 1,
      status: status || 'ACTIVE',
      organizationId: adminUser.organizationId,
      officeId: adminUser.officeId || undefined,
    });

    return NextResponse.json({ success: true, data: rule });
  } catch (error: any) {
    console.error('Create Priority Rule Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
