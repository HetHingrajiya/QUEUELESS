import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import { Notification } from '@/models/Notification';
import { getSocket } from '@/lib/socketClient';

export async function GET(req: Request) {
  try {
    await dbConnect();
    // Simulate user session extraction
    const userId = '60d0fe4f5311236168a109ca'; // In real app, extract from session
    
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
    const body = await req.json();
    
    const notification = await Notification.create(body);
    
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
    const userId = '60d0fe4f5311236168a109ca'; // Mock session
    
    // Mark all as read
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
