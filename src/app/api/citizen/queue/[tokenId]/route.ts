import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import { Token, TokenStatus } from '@/models/Token';
import { Counter } from '@/models/Counter';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tokenId: string }> }) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();
    
    if (!user || user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { tokenId } = await params;

    const myToken = await Token.findById(tokenId).populate('serviceId', 'name').populate('officeId', 'name').lean();
    
    if (!myToken) {
      return NextResponse.json({ success: false, message: 'Token not found' }, { status: 404 });
    }

    if (myToken.citizenId?.toString() !== user.userId) {
       return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const officeId = myToken.officeId._id;
    const serviceId = myToken.serviceId._id;
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Get currently serving token(s) for this service
    const servingTokens = await Token.find({
      officeId,
      serviceId,
      status: { $in: [TokenStatus.SERVING, TokenStatus.CALLED] },
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ callTime: -1, createdAt: 1 }).lean();

    const nowServing = servingTokens.length > 0 ? servingTokens[0].tokenNumber : null;

    // Get all waiting tokens for this service, ordered by queue position / createdAt
    const allWaiting = await Token.find({
      officeId,
      serviceId,
      status: { $in: [TokenStatus.WAITING, TokenStatus.CHECKED_IN] },
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ createdAt: 1 }).lean();

    // Find my position
    let peopleAhead = 0;
    if (myToken.status === TokenStatus.WAITING || myToken.status === TokenStatus.CHECKED_IN) {
      const myIndex = allWaiting.findIndex(t => t._id.toString() === myToken._id.toString());
      if (myIndex !== -1) {
        peopleAhead = myIndex;
      }
    }

    // Next 5 tokens (just for display of queue progress)
    const nextTokens = allWaiting.slice(0, 5).map(t => t.tokenNumber);

    // Calculate estimated wait using ML
    const { predictWaitTime } = await import('@/lib/ml');
    const mlPrediction = await predictWaitTime(
      serviceId.toString(), 
      officeId.toString(), 
      myToken.priority || 'NORMAL'
    );
    // Fallback if prediction is strictly a fallback
    let estimatedWaitMin = mlPrediction.estimated_wait_time_mins;
    if (mlPrediction.prediction_source === 'FALLBACK' && peopleAhead > 0) {
       estimatedWaitMin = peopleAhead * 5;
    }

    return NextResponse.json({
      success: true,
      data: {
        token: {
          _id: myToken._id,
          tokenNumber: myToken.tokenNumber,
          status: myToken.status,
          serviceName: myToken.serviceId.name,
          officeName: myToken.officeId.name,
          createdAt: myToken.createdAt
        },
        nowServing,
        peopleAhead,
        estimatedWaitMin,
        nextTokens,
        aiConfidence: mlPrediction.confidence_score,
        predictionSource: mlPrediction.prediction_source || 'ML_MODEL'
      }
    });

  } catch (error: any) {
    console.error('Citizen Live Queue API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
