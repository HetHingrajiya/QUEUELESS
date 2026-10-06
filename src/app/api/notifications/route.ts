import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Notification } from '@/models/Notification';
import { getSocket } from '@/lib/socketClient';
import { getUserFromCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';
import { requirePermission } from '@/lib/rbac';

export async function GET(req: Request) {
  try {
    await dbConnect();
    
    // Extract user from session/cookie
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.userId;
    
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
    
    const user = await requirePermission('notifications', 'add');
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    let targetUserId = body.userId;
    
    // CITIZEN can only send notifications to self (or not at all, usually system sends it)
    if (user.role === 'CITIZEN') {
       targetUserId = user.userId;
    } else if (user.role === 'STAFF') {
       // Staff logic, maybe only specific targets
       if (targetUserId !== user.userId) {
         return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
       }
    } else if (user.role === 'ADMIN') {
      // Must verify target user belongs to same organization
      const { User } = await import('@/models/User');
      const targetUser = await User.findById(targetUserId);
      if (!targetUser || targetUser.organizationId?.toString() !== user.organizationId?.toString()) {
        return NextResponse.json({ success: false, message: 'Forbidden: Target user not in your organization' }, { status: 403 });
      }
    }
    const notification = await Notification.create({
      ...body,
      userId: targetUserId
    });
    
    // Emit via socket
    const socket = getSocket();
    socket.emit('notification:new', notification);

    await createAuditLog({
      action: 'CREATE',
      module: 'Notifications',
      description: `Notification created for user ${notification.userId}`,
      entityType: 'Notification',
      entityId: notification._id.toString(),
      newData: notification.toObject(),
      status: 'SUCCESS',
      request: req
    });

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
    const userId = user.userId;
    
    // Mark all as read
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });

    await createAuditLog({
      action: 'UPDATE',
      module: 'Notifications',
      description: `Marked all notifications as read for user ${userId}`,
      entityType: 'Notification',
      status: 'SUCCESS',
      request: req
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
