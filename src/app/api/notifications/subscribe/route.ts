import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { getUserFromCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await getUserFromCookie();

    if (!authUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { subscription } = await req.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ success: false, message: 'Invalid subscription object' }, { status: 400 });
    }

    // Save subscription to user
    await User.findByIdAndUpdate(authUser.userId, {
      pushSubscription: subscription
    });

    return NextResponse.json({ success: true, message: 'Push subscription saved successfully' });
  } catch (error: any) {
    console.error('Push Subscribe API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
