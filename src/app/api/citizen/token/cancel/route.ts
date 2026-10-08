import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Token, TokenStatus } from '@/models/Token';
import { QueueEvent } from '@/models/QueueEvent';
import { getUserFromCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { tokenId, reason } = body;

    if (!tokenId) {
      return NextResponse.json({ success: false, message: 'Token ID is required' }, { status: 400 });
    }

    const token = await Token.findById(tokenId);
    if (!token) {
      return NextResponse.json({ success: false, message: 'Token not found' }, { status: 404 });
    }

    // Citizen can only cancel their own token
    if (token.citizenId?.toString() !== user.userId) {
      return NextResponse.json({ success: false, message: 'Forbidden: You can only cancel your own token' }, { status: 403 });
    }

    // Only waiting, checked_in, or called tokens can be cancelled
    if ([TokenStatus.COMPLETED, TokenStatus.CANCELLED, TokenStatus.NO_SHOW].includes(token.status as any)) {
      return NextResponse.json({ 
        success: false, 
        message: `Token cannot be cancelled because it is already ${token.status}` 
      }, { status: 400 });
    }

    token.status = TokenStatus.CANCELLED;
    token.notes = reason || 'Cancelled by citizen';
    await token.save();

    await QueueEvent.create({
      tokenId: token._id,
      officeId: token.officeId,
      serviceId: token.serviceId,
      eventType: 'CANCELLED',
      details: { reason: reason || 'Cancelled by citizen', cancelledBy: 'CITIZEN' }
    });

    return NextResponse.json({
      success: true,
      message: 'Token successfully cancelled',
      data: {
        tokenId: token._id,
        status: token.status,
        reason: token.notes
      }
    });

  } catch (error: any) {
    console.error('Citizen Cancel Token API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
