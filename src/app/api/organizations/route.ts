import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Organization } from '@/models/Organization';

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
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    
    const existing = await Organization.findOne({ code: body.code });
    if (existing) {
      return NextResponse.json({ success: false, message: 'Organization code already exists' }, { status: 400 });
    }

    const newOrg = await Organization.create(body);

    return NextResponse.json({
      success: true,
      message: 'Organization created successfully',
      data: newOrg
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
