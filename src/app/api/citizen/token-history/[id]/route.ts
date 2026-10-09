import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Token } from '@/models/Token';
import { QueueEvent } from '@/models/QueueEvent';
import { Feedback } from '@/models/Feedback';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      return NextResponse.json({ success: false, message: 'Invalid Token ID' }, { status: 400 });
    }

    interface PopulatedHistoryTokenDoc {
      _id: mongoose.Types.ObjectId;
      tokenNumber: string;
      status: string;
      queuePosition?: number;
      priority?: string;
      notes?: string;
      createdAt: Date;
      callTime?: Date;
      startTime?: Date;
      completedAt?: Date;
      completionTime?: Date;
      processingTime?: number;
      estimatedWaitTime?: number;
      officeId?: { name?: string; address?: string; department?: string; phone?: string; email?: string; workingHours?: unknown };
      serviceId?: { name?: string; description?: string; estimatedServiceTime?: number; fee?: number; requiredDocuments?: unknown };
      counterId?: { name?: string; counterNumber?: number };
    }

    const token = await Token.findOne({ _id: id, citizenId: user.userId })
      .populate('officeId', 'name address department phone email workingHours')
      .populate('serviceId', 'name description estimatedServiceTime fee requiredDocuments')
      .populate('counterId', 'name counterNumber')
      .lean() as unknown as PopulatedHistoryTokenDoc | null;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Token record not found' }, { status: 404 });
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
    if (typeof token.processingTime === 'number' && token.processingTime > 0) {
      serviceDuration = Math.round(token.processingTime / 60);
    } else {
      const completion = token.completionTime || token.completedAt;
      const start = token.startTime || token.callTime;
      if (completion && start) {
        serviceDuration = Math.max(1, Math.round((new Date(completion).getTime() - new Date(start).getTime()) / 60000));
      }
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

  } catch (error) {
    console.error('Citizen Token History Detail API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
