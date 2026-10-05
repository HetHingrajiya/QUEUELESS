import { NextResponse, NextRequest } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Counter } from '@/models/Counter';
import { headers } from 'next/headers';
import { User } from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const user = await getUserFromCookie();
    const userId = user?.userId;
    
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { status } = body;

    if (!['ACTIVE', 'PAUSED', 'OFFLINE'].includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
    }

    // Find the counter assigned to this staff member
    const counter = await Counter.findOne({ staffId: userId });
    
    if (!counter) {
      return NextResponse.json({ success: false, message: 'No counter assigned to you' }, { status: 404 });
    }

    counter.status = status;
    await counter.save();

    return NextResponse.json({
      success: true,
      message: `Counter status updated to ${status}`,
      data: {
        counterId: counter._id,
        status: counter.status
      }
    });

  } catch (error: any) {
    console.error('Counter Status API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
