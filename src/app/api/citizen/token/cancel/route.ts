import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Token, TokenStatus } from '@/models/Token';
import { QueueEvent } from '@/models/QueueEvent';
import { getUserFromCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';
import { canCancel, QueueEventTypes } from '@/lib/queue';

export async function POST(req: NextRequest) {
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
    const { tokenId, reason } = body;

    if (!tokenId || !mongoose.Types.ObjectId.isValid(tokenId)) {
      return NextResponse.json({ success: false, message: 'Valid Token ID is required' }, { status: 400 });
    }

    let token = await Token.findById(tokenId);
    if (!token) {
      return NextResponse.json({ success: false, message: 'Token not found' }, { status: 404 });
    }

    // Citizen can only cancel their own token
    if (token.citizenId?.toString() !== user.userId) {
      return NextResponse.json({ success: false, message: 'Forbidden: You can only cancel your own token' }, { status: 403 });
    }

    // Validate current state before attempting the atomic transition.
    const cancelValidation = canCancel(token.status);
    if (!cancelValidation.allowed) {
      return NextResponse.json({
        success: false,
        message: cancelValidation.reason || 'Token cannot be cancelled'
      }, { status: 400 });
    }

    const cancelReason = typeof reason === 'string' ? reason.trim().slice(0, 500) : '';
    const cancellationTimestamp = new Date();

    // Use a conditional update so a concurrent staff call/start action cannot
    // be overwritten by a stale citizen-side document save.
    const cancelledToken = await Token.findOneAndUpdate(
      {
        _id: token._id,
        citizenId: user.userId,
        status: { $in: [TokenStatus.WAITING, TokenStatus.CHECKED_IN, TokenStatus.CALLED] }
      },
      {
        $set: {
          status: TokenStatus.CANCELLED,
          notes: cancelReason || 'Cancelled by citizen',
          cancellationReason: cancelReason || 'Cancelled by citizen',
          cancelledAt: cancellationTimestamp,
          endTime: cancellationTimestamp
        }
      },
      { returnDocument: 'after', runValidators: true }
    );

    if (!cancelledToken) {
      return NextResponse.json({
        success: false,
        message: 'This token has changed state and can no longer be cancelled. Refresh the queue and try again.',
        errorCode: 'TOKEN_STATE_CHANGED'
      }, { status: 409 });
    }

    token = cancelledToken;

    await QueueEvent.create({
      tokenId: token._id,
      officeId: token.officeId,
      serviceId: token.serviceId,
      eventType: QueueEventTypes.CANCELLED,
      details: { reason: token.notes, cancelledBy: 'CITIZEN' }
    });

    await createAuditLog({
      action: 'CANCEL_TOKEN',
      module: 'QUEUE',
      description: `Citizen cancelled token ${token.tokenNumber}`,
      entityType: 'Token',
      entityId: token._id.toString(),
      userId: user.userId,
      userRole: user.role,
      officeId: token.officeId?.toString(),
      request: req
    });

    // Persist a citizen-visible notification; delivery failures must not undo cancellation.
    try {
      const { Notification } = await import('@/models/Notification');
      await Notification.create({
        userId: user.userId,
        officeId: token.officeId,
        tokenId: token._id,
        type: 'TOKEN',
        title: 'Token Cancelled',
        message: `Your token ${token.tokenNumber} has been cancelled successfully.`,
        channel: 'IN_APP',
        isRead: false
      });
      try {
        const { sendWebPush } = await import('@/lib/push');
        await sendWebPush(user.userId, 'Token Cancelled', `Your token ${token.tokenNumber} has been cancelled successfully.`, '/citizen/notifications');
      } catch (pushErr) {
        console.error('Failed to send cancellation push notification', pushErr);
      }
      try {
        const { getSocket } = await import('@/lib/socketClient');
        getSocket().emit('notification:new', {
          userId: user.userId,
          officeId: token.officeId?.toString(),
          tokenId: token._id.toString(),
          type: 'TOKEN',
          title: 'Token Cancelled',
          message: `Your token ${token.tokenNumber} has been cancelled successfully.`,
          createdAt: new Date().toISOString()
        });
      } catch (socketErr) {
        console.error('Failed to broadcast cancellation notification', socketErr);
      }
    } catch (notificationErr) {
      console.error('Failed to persist cancellation notification', notificationErr);
    }

    try {
      const { getSocket } = await import('@/lib/socketClient');
      const socket = getSocket();
      const officeIdStr = token.officeId?.toString();
      const tokenIdStr = token._id.toString();

      socket.emit('queue:action', { 
        action: 'CANCEL', 
        officeId: officeIdStr, 
        tokenId: tokenIdStr, 
        status: token.status 
      });
      socket.emit('queue:updated', { 
        officeId: officeIdStr, 
        serviceId: token.serviceId?.toString() 
      });
      socket.emit('token:cancelled', { 
        tokenId: tokenIdStr, 
        tokenNumber: token.tokenNumber,
        officeId: officeIdStr 
      });
    } catch {
      // socket broadcast optional
    }

    return NextResponse.json({
      success: true,
      message: 'Token successfully cancelled',
      data: {
        tokenId: token._id,
        status: token.status,
        reason: token.notes
      }
    });

  } catch (error) {
    console.error('Citizen Cancel Token API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
