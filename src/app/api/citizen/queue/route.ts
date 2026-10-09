import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Token } from '@/models/Token';
import { QueueEvent } from '@/models/QueueEvent';
import { getUserFromCookie } from '@/lib/auth';
import { predictWaitTime } from '@/lib/ml';
import { ACTIVE_TOKEN_STATUSES, QueueMetricsService } from '@/lib/queue';

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
    const requestedTokenId = searchParams.get('tokenId');

    interface QueueTokenDoc {
      _id: mongoose.Types.ObjectId;
      tokenNumber: string;
      status: string;
      priority?: string;
      createdAt: Date;
      updatedAt?: Date;
      checkInTime?: Date;
      callTime?: Date;
      startTime?: Date;
      completionTime?: Date;
      endTime?: Date;
      processingTime?: number;
      cancellationReason?: string;
      notes?: string;
      cancelledAt?: Date;
      serviceId?: { _id: mongoose.Types.ObjectId; name?: string; averageServiceTime?: number };
      officeId?: { _id: mongoose.Types.ObjectId; name?: string; address?: string; latitude?: number; longitude?: number };
      counterId?: { name?: string; number?: number };
    }

    interface TransferEventDoc {
      metadata?: { previousCounterName?: string };
      counterId?: { name?: string; number?: number };
      createdAt: Date;
    }

    interface MLWaitPrediction {
      estimated_wait_time_mins: number;
      confidence_score: number | null;
      prediction_source: string;
    }

    const query: Record<string, unknown> = { citizenId: user.userId };
    if (requestedTokenId) {
      if (!mongoose.Types.ObjectId.isValid(requestedTokenId)) {
        return NextResponse.json({ success: false, message: 'Invalid token ID' }, { status: 400 });
      }
      query._id = requestedTokenId;
    } else {
      query.status = { $in: ACTIVE_TOKEN_STATUSES };
    }

    const myToken = await Token.findOne(query)
      .populate('serviceId', 'name averageServiceTime')
      .populate('officeId', 'name address latitude longitude')
      .populate('counterId', 'name number')
      .sort({ createdAt: -1 })
      .lean() as unknown as QueueTokenDoc | null;

    if (!myToken) {
      return NextResponse.json({ success: true, data: null });
    }

    const officeId = myToken.officeId?._id;
    const serviceId = myToken.serviceId?._id;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const metrics = await QueueMetricsService.getTokenPositionMetrics(myToken._id, user.userId);
    const peopleAhead = metrics?.peopleAhead ?? 0;
    const nowServing = metrics?.nowServing ?? null;
    const nextTokens = metrics?.nextTokens ?? [];

    // ML prediction
    let mlPrediction: MLWaitPrediction = { estimated_wait_time_mins: 15, confidence_score: null, prediction_source: 'FALLBACK' };
    try {
      mlPrediction = await predictWaitTime(
        serviceId?.toString() || '', 
        officeId?.toString() || '',
        myToken.priority || 'NORMAL',
        peopleAhead,
        metrics?.estimatedWaitMinutes ?? 5
      );
    } catch {}

    const estimatedWaitMin = (mlPrediction && mlPrediction.prediction_source === 'ML_MODEL')
      ? mlPrediction.estimated_wait_time_mins
      : (metrics?.estimatedWaitMinutes ?? 0);

    let transferDetails = null;
    try {
      const transferEvent = await QueueEvent.findOne({
        tokenId: myToken._id,
        eventType: 'TRANSFERRED'
      }).populate('counterId', 'name number').sort({ createdAt: -1 }).lean() as unknown as TransferEventDoc | null;

      if (transferEvent) {
        transferDetails = {
          previousCounterName: transferEvent.metadata?.previousCounterName || 'Previous Counter',
          newCounterName: transferEvent.counterId?.name || (transferEvent.counterId?.number ? `Counter ${transferEvent.counterId.number}` : 'New Counter'),
          transferTime: transferEvent.createdAt
        };
      }
    } catch {
      // transfer details optional
    }

    return NextResponse.json({
      success: true,
      data: {
        token: {
          _id: myToken._id,
          tokenNumber: myToken.tokenNumber,
          status: myToken.status,
          serviceName: myToken.serviceId?.name || 'Service',
          officeName: myToken.officeId?.name || 'Office',
          counterName: myToken.counterId?.name,
          counterNumber: myToken.counterId?.number,
          officeLatitude: myToken.officeId?.latitude ?? null,
          officeLongitude: myToken.officeId?.longitude ?? null,
          createdAt: myToken.createdAt,
          updatedAt: myToken.updatedAt,
          checkInTime: myToken.checkInTime,
          callTime: myToken.callTime,
          startTime: myToken.startTime,
          completionTime: myToken.completionTime,
          endTime: myToken.endTime,
          processingTime: myToken.processingTime,
          cancellationReason: myToken.cancellationReason || myToken.notes,
          notes: myToken.notes,
          cancelledAt: myToken.cancelledAt,
          transferDetails
        },
        nowServing,
        peopleAhead,
        estimatedWaitMin,
        nextTokens,
        aiConfidence: mlPrediction.confidence_score,
        predictionSource: mlPrediction.prediction_source,
        queueLoad: metrics?.queueLoad.level || 'LOW',
        transferDetails
      }
    });
  } catch (error) {
    console.error('Citizen Live Queue root GET error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
