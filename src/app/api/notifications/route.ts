import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Notification } from '@/models/Notification';
import { User } from '@/models/User';
import { getSocket } from '@/lib/socketClient';
import { getUserFromCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';
import { hasPermission } from '@/lib/permissions';

const NOTIFICATION_TYPES = new Set(['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'SYSTEM']);

export async function GET(req: Request) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const unreadOnly = new URL(req.url).searchParams.get('unread') === 'true';
    const query: any = { userId: user.userId };
    if (unreadOnly) query.isRead = false;

    const notifications = await Notification.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    const type = typeof body?.type === 'string' ? body.type.toUpperCase() : 'INFO';
    const link = body?.link == null ? undefined : String(body.link).trim();
    const targetUserId = String(body?.userId || user.userId);

    if (!title || title.length > 200) {
      return NextResponse.json({ success: false, message: 'Title is required and must be <= 200 characters' }, { status: 400 });
    }
    if (!message || message.length > 5000) {
      return NextResponse.json({ success: false, message: 'Message is required and must be <= 5000 characters' }, { status: 400 });
    }
    if (!NOTIFICATION_TYPES.has(type)) {
      return NextResponse.json({ success: false, message: 'Invalid notification type' }, { status: 400 });
    }

    if (user.role === 'SUPER_ADMIN') {
      // Full notification management.
    } else if (user.role === 'ADMIN') {
      if (!(await hasPermission(user.userId, 'MANAGE_SETTINGS'))) {
        return NextResponse.json({ success: false, message: 'Forbidden: Missing MANAGE_SETTINGS permission' }, { status: 403 });
      }
      const target = await User.findById(targetUserId).select('_id organizationId').lean();
      if (!target || target.organizationId?.toString() !== user.organizationId?.toString()) {
        return NextResponse.json({ success: false, message: 'Forbidden: Target user is outside your organization' }, { status: 403 });
      }
    } else {
      if (targetUserId !== user.userId) {
        return NextResponse.json({ success: false, message: 'Forbidden: Cannot create notifications for other users' }, { status: 403 });
      }
    }

    const notification = await Notification.create({
      userId: targetUserId,
      title,
      message,
      type,
      ...(link ? { link } : {}),
      isRead: false,
    });

    try {
      getSocket().emit('notification:new', notification);
    } catch (socketError) {
      console.error('Notification socket emit failed:', socketError);
    }

    await createAuditLog({
      action: 'CREATE',
      module: 'Notifications',
      description: `Notification created for user ${notification.userId}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'Notification',
      entityId: notification._id.toString(),
      newData: notification.toObject(),
      status: 'SUCCESS',
      request: req,
    });

    return NextResponse.json({ success: true, data: notification }, { status: 201 });
  } catch (error: any) {
    console.error('Notifications POST error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await Notification.updateMany({ userId: user.userId, isRead: false }, { $set: { isRead: true } });

    await createAuditLog({
      action: 'UPDATE',
      module: 'Notifications',
      description: `Marked all notifications as read for user ${user.userId}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'Notification',
      status: 'SUCCESS',
      request: req,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notifications PATCH error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
