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

    const token = await Token.findById(tokenId);
    if (!token) {
      return NextResponse.json({ success: false, message: 'Token not found' }, { status: 404 });
    }

    // Citizen can only cancel their own token
    if (token.citizenId?.toString() !== user.userId) {
      return NextResponse.json({ success: false, message: 'Forbidden: You can only cancel your own token' }, { status: 403 });
    }

    // Validate transition
    const cancelValidation = canCancel(token.status);
    if (!cancelValidation.allowed) {
      return NextResponse.json({ 
        success: false, 
        message: cancelValidation.reason || 'Token cannot be cancelled' 
      }, { status: 400 });
    }

    token.status = TokenStatus.CANCELLED;
    const cancelReason = typeof reason === 'string' && reason.trim() ? reason.trim() : 'Cancelled by citizen';
    token.notes = cancelReason;
    token.cancellationReason = cancelReason;
    token.cancelledAt = new Date();
    token.endTime = new Date();
    await token.save();

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
