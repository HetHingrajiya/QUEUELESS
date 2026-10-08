import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Token } from '@/models/Token';
import { QueueEvent } from '@/models/QueueEvent';
import { Feedback } from '@/models/Feedback';
import { getUserFromCookie } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    let token: any = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      token = await Token.findById(id)
        .populate('officeId', 'name address department phone email workingHours')
        .populate('serviceId', 'name description estimatedServiceTime fee requiredDocuments')
        .populate('counterId', 'name counterNumber')
        .lean();
    }
    if (!token) {
      token = await Token.findOne({ citizenId: user.userId })
        .populate('officeId', 'name address department phone email workingHours')
        .populate('serviceId', 'name description estimatedServiceTime fee requiredDocuments')
        .populate('counterId', 'name counterNumber')
        .sort({ createdAt: -1 })
        .lean();
    }
    if (!token) {
      token = await Token.findOne()
        .populate('officeId', 'name address department phone email workingHours')
        .populate('serviceId', 'name description estimatedServiceTime fee requiredDocuments')
        .populate('counterId', 'name counterNumber')
        .sort({ createdAt: -1 })
        .lean();
    }

    if (!token) {
      return NextResponse.json({ success: false, message: 'No token records found' }, { status: 404 });
    }

    // Get all queue events for this token for chronological timeline
    const events = await QueueEvent.find({ tokenId: token._id })
      .sort({ createdAt: 1 })
      .lean();

    // Check if feedback was already submitted
    const feedback = await Feedback.findOne({ tokenId: token._id, userId: user.userId }).lean();

    // Compute durations
    let waitMinutes = 0;
    if (token.callTime && token.createdAt) {
      waitMinutes = Math.max(1, Math.round((new Date(token.callTime).getTime() - new Date(token.createdAt).getTime()) / 60000));
    } else if (token.estimatedWaitTime) {
      waitMinutes = token.estimatedWaitTime;
    }

    let serviceDuration = 0;
    if (token.completedAt && token.startTime) {
      serviceDuration = Math.max(1, Math.round((new Date(token.completedAt).getTime() - new Date(token.startTime).getTime()) / 60000));
    }

    return NextResponse.json({
      success: true,
      data: {
        token: {
          _id: token._id,
          tokenNumber: token.tokenNumber,
          status: token.status,
          queuePosition: token.queuePosition,
          priority: token.priority,
          notes: token.notes,
          createdAt: token.createdAt,
          callTime: token.callTime,
          startTime: token.startTime,
          completedAt: token.completedAt,
          waitMinutes,
          serviceDuration
        },
        office: token.officeId,
        service: token.serviceId,
        counter: token.counterId,
        timeline: events.map(e => ({
          eventType: e.eventType,
          time: e.createdAt,
          details: e.details
        })),
        feedback: feedback ? {
          rating: feedback.rating,
          comment: feedback.comment,
          createdAt: feedback.createdAt
        } : null
      }
    });

  } catch (error: any) {
    console.error('Citizen Token History Detail API error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
