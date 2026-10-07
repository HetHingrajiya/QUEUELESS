import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import { Token, TokenStatus } from '@/models/Token';
import { predictWaitTime } from '@/lib/ml';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tokenId: string }> }) {
  try {
    await dbConnect();
    
    const { tokenId } = await params;
    
    const myToken = await Token.findById(tokenId).populate('serviceId').populate('officeId').lean();
    if (!myToken) {
      return NextResponse.json({ success: false, message: 'Token not found' }, { status: 404 });
    }

    const officeId = myToken.officeId._id.toString();
    const serviceId = myToken.serviceId._id.toString();

    // Call ML Engine
    const mlPrediction = await predictWaitTime(
      serviceId,
      officeId,
      myToken.priority || 'NORMAL'
    );

    return NextResponse.json({
      success: true,
      data: {
        tokenNumber: myToken.tokenNumber,
        serviceName: myToken.serviceId.name,
        predictedWaitTime: mlPrediction.estimated_wait_time_mins,
        confidence: mlPrediction.confidence_score,
        factors: mlPrediction.factors || {
          "Queue Length": "High Impact",
          "Time of Day": "Medium Impact",
          "Service Complexity": "Medium Impact"
        }
      }
    });

  } catch (error: any) {
    console.error('Citizen Prediction API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
