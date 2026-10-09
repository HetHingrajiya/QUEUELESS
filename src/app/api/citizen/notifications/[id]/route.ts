import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Notification } from '@/models/Notification';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || !user.userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Valid Notification ID required' }, { status: 400 });
    }

    const notification = await Notification.findOne({ _id: id, userId: user.userId })
      .populate('officeId', 'name address code')
      .populate('tokenId', 'tokenNumber status priority')
      .lean();

    if (!notification) {
      return NextResponse.json({ success: false, message: 'Notification not found' }, { status: 404 });
    }

    // Persist read state if unread
    if (!notification.isRead) {
      await Notification.updateOne({ _id: id, userId: user.userId }, { $set: { isRead: true } });
      notification.isRead = true;
    }

    return NextResponse.json({
      success: true,
      data: notification
    });

  } catch (error) {
    console.error('Citizen Notification Detail GET Error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || !user.userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Valid Notification ID required' }, { status: 400 });
    }

    const updated = await Notification.findOneAndUpdate(
      { _id: id, userId: user.userId },
      { $set: { isRead: true } },
      { returnDocument: 'after' }
    );

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
      data: updated
    });

  } catch (error) {
    console.error('Citizen Notification Detail PATCH Error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || !user.userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Valid Notification ID required' }, { status: 400 });
    }

    const deleted = await Notification.findOneAndDelete({ _id: id, userId: user.userId });

    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted'
    });

  } catch (error) {
    console.error('Citizen Notification Detail DELETE Error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
