import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Office } from '@/models/Office';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await dbConnect();
    // Allow reading offices by anyone
    const url = new URL(request.url);
    const orgId = url.searchParams.get('organizationId');
    let query: any = {};
    
    const user = await getUserFromCookie();
    if (user && user.role === 'ADMIN') {
      query = { organizationId: user.organizationId };
    } else if (orgId) {
      query = { organizationId: orgId };
    }
    
    const offices = await Office.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: offices });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    // Auth Check
    const user = await getUserFromCookie();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    
    const existingOffice = await Office.findOne({ code: body.code });
    if (existingOffice) {
      return NextResponse.json({ success: false, message: 'Office code already exists' }, { status: 400 });
    }

    const newOffice = await Office.create(body);

    return NextResponse.json({
      success: true,
      message: 'Office created successfully',
      data: newOffice
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
