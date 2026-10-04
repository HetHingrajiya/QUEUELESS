import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Service } from '@/models/Service';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const officeId = url.searchParams.get('officeId');
    const query = officeId ? { officeId } : {};
    
    const services = await Service.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: services });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    // Auth Check
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    
    const existingService = await Service.findOne({ code: body.code });
    if (existingService) {
      return NextResponse.json({ success: false, message: 'Service code already exists' }, { status: 400 });
    }

    const newService = await Service.create(body);

    return NextResponse.json({
      success: true,
      message: 'Service created successfully',
      data: newService
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
