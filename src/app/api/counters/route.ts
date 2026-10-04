import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Counter } from '@/models/Counter';

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    // Auth Check from headers set by middleware
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const officeId = request.headers.get('x-office-id');

    if (!userId || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 403 });
    }

    const body = await request.json();
    
    // In a real app, use the officeId from the authenticated Admin token, 
    // but allow Super Admin to pass officeId in body.
    const finalOfficeId = userRole === 'ADMIN' && officeId ? officeId : body.officeId;

    if (!finalOfficeId) {
      return NextResponse.json({ success: false, message: 'Office ID is required' }, { status: 400 });
    }

    // Check for duplicate counter number in the same office
    const existingCounter = await Counter.findOne({ number: body.number, officeId: finalOfficeId });
    if (existingCounter) {
      return NextResponse.json({ 
        success: false, 
        message: 'Counter number already exists in this office',
        errorCode: 'COUNTER_EXISTS'
      }, { status: 400 });
    }

    const newCounter = await Counter.create({
      number: body.number,
      name: body.name,
      officeId: finalOfficeId,
      serviceId: body.serviceId,
      staffId: body.staffId || null,
      status: body.status || 'OFFLINE'
    });

    return NextResponse.json({
      success: true,
      message: 'Counter created successfully',
      data: newCounter
    });

  } catch (error) {
    console.error('Create counter error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
