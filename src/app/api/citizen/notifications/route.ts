import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Notification } from '@/models/Notification';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || !user.userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category'); // QUEUE, TOKEN, OFFICE, SYSTEM, ALL

    const filter: Record<string, unknown> = { userId: user.userId };
    if (category && category !== 'ALL') {
      filter.type = category.toUpperCase();
    }

    const notifications = await Notification.find(filter)
      .populate('officeId', 'name')
      .populate('tokenId', 'tokenNumber status')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({ userId: user.userId, isRead: false });

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });

  } catch (error) {
    console.error('Citizen Notifications API GET error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || !user.userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      await Notification.updateMany({ userId: user.userId, isRead: false }, { $set: { isRead: true } });
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
      return NextResponse.json({ success: false, message: 'Valid Notification ID required' }, { status: 400 });
    }

    const updated = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: user.userId },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Notification marked as read', data: updated });

  } catch (error) {
    console.error('Citizen Notifications API PATCH error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || !user.userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Valid Notification ID required' }, { status: 400 });
    }

    const deleted = await Notification.findOneAndDelete({ _id: id, userId: user.userId });
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Notification deleted' });

  } catch (error) {
    console.error('Citizen Notifications API DELETE error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
