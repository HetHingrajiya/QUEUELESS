import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Notification } from '@/models/Notification';
import { getSocket } from '@/lib/socketClient';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await dbConnect();
    
    // Extract user from session/cookie
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const userId = user._id.toString();
    
    const url = new URL(req.url);
    const unreadOnly = url.searchParams.get('unread') === 'true';

    const query: any = { userId };
    if (unreadOnly) {
      query.isRead = false;
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: notifications });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Create the notification for the current user if userId isn't provided in the body
    const notification = await Notification.create({
      ...body,
      userId: body.userId || user._id.toString()
    });
    
    // Emit via socket
    const socket = getSocket();
    socket.emit('notification:new', notification);

    return NextResponse.json({ success: true, data: notification }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await dbConnect();
    
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const userId = user._id.toString();
    
    // Mark all as read
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
