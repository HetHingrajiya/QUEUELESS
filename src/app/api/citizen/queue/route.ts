import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Token, TokenStatus } from '@/models/Token';
import { Counter } from '@/models/Counter';
import { getUserFromCookie } from '@/lib/auth';
import { predictWaitTime } from '@/lib/ml';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedTokenId = searchParams.get('tokenId');

    let query: any = { citizenId: user.userId };
    if (requestedTokenId) {
      query._id = requestedTokenId;
    } else {
      query.status = { $in: [TokenStatus.WAITING, TokenStatus.CHECKED_IN, TokenStatus.CALLED, TokenStatus.SERVING] };
    }

    const myToken = await Token.findOne(query)
      .populate('serviceId', 'name averageServiceTime')
      .populate('officeId', 'name address latitude longitude')
      .populate('counterId', 'name number')
      .sort({ createdAt: -1 })
      .lean();

    if (!myToken) {
      return NextResponse.json({ success: true, data: null });
    }

    const officeId = myToken.officeId?._id;
    const serviceId = myToken.serviceId?._id;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Serving tokens
    const servingTokens = await Token.find({
      officeId,
      serviceId,
      status: { $in: [TokenStatus.SERVING, TokenStatus.CALLED] },
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ callTime: -1 }).lean();

    const nowServing = servingTokens.length > 0 ? servingTokens[0].tokenNumber : null;

    // All waiting
    const allWaiting = await Token.find({
      officeId,
      serviceId,
      status: { $in: [TokenStatus.WAITING, TokenStatus.CHECKED_IN] },
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ createdAt: 1 }).lean();

    let peopleAhead = 0;
    if (myToken.status === TokenStatus.WAITING || myToken.status === TokenStatus.CHECKED_IN) {
      const idx = allWaiting.findIndex((t: any) => t._id.toString() === myToken._id.toString());
      if (idx !== -1) peopleAhead = idx;
    }

    const nextTokens = allWaiting.slice(0, 5).map((t: any) => t.tokenNumber);

    // ML prediction
    let mlPrediction: any = { estimated_wait_time_mins: 15, confidence_score: 0, prediction_source: 'FALLBACK' };
    try {
      mlPrediction = await predictWaitTime(serviceId?.toString() || '', officeId?.toString() || '');
    } catch {}

    let estimatedWaitMin = mlPrediction.estimated_wait_time_mins;
    if (mlPrediction.prediction_source === 'FALLBACK' && peopleAhead > 0) {
      estimatedWaitMin = peopleAhead * (myToken.serviceId?.averageServiceTime || 10);
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
          createdAt: myToken.createdAt,
          checkInTime: myToken.checkInTime,
          callTime: myToken.callTime
        },
        nowServing,
        peopleAhead,
        estimatedWaitMin,
        nextTokens,
        aiConfidence: mlPrediction.confidence_score,
        predictionSource: mlPrediction.prediction_source
      }
    });
  } catch (error: any) {
    console.error('Citizen Live Queue root GET error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
