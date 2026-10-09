import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Token } from '@/models/Token';
import { getComprehensiveQueueAnalytics } from '@/lib/ml';
import { getUserFromCookie } from '@/lib/auth';
import { QueueMetricsService } from '@/lib/queue';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tokenId: string }> }) {
  try {
    await dbConnect();
    
    const user = await getUserFromCookie();
    if (!user || !user.userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { tokenId } = await params;
    
    if (!tokenId || !mongoose.Types.ObjectId.isValid(tokenId)) {
      return NextResponse.json({ success: false, message: 'Invalid Token ID' }, { status: 400 });
    }

    interface PredictionTokenDoc {
      _id: mongoose.Types.ObjectId;
      tokenNumber: string;
      priority?: string;
      officeId?: { _id: mongoose.Types.ObjectId; name?: string };
      serviceId?: { _id: mongoose.Types.ObjectId; name?: string };
    }

    const myToken = await Token.findOne({ _id: tokenId, citizenId: user.userId })
      .populate('serviceId')
      .populate('officeId')
      .lean() as unknown as PredictionTokenDoc | null;
      
    if (!myToken) {
      return NextResponse.json({ success: false, message: 'Token not found' }, { status: 404 });
    }

    const officeId = myToken.officeId?._id?.toString() || '';
    const serviceId = myToken.serviceId?._id?.toString() || '';
    const metrics = await QueueMetricsService.getTokenPositionMetrics(tokenId, user.userId);
    const waitingAhead = metrics?.peopleAhead ?? 0;
    const serviceAvg = metrics?.averageServiceTimeMinutes ?? 5;
    const activeCounters = metrics?.activeCountersCount ?? 1;

    // Call Expanded AI Analytics Engine with strict data isolation
    const analytics = await getComprehensiveQueueAnalytics(
      serviceId,
      officeId,
      myToken.priority || 'NORMAL',
      waitingAhead,
      15,
      metrics?.estimatedWaitMinutes ?? 5
    );

    const waitPred = analytics.wait_time_prediction;
    const predictedMins = waitPred.estimated_wait_time_mins;
    const confidence = waitPred.confidence_score; // Genuine calibrated score or null

    return NextResponse.json({
      success: true,
      data: {
        tokenNumber: myToken.tokenNumber,
        serviceName: myToken.serviceId?.name,
        predictedWaitTime: predictedMins,
        confidence,
        predictionSource: waitPred.prediction_source,
        waitingAhead,
        activeCounters,
        queueLoad: analytics.queue_load_forecast.level,
        modelVersion: waitPred.model_version,
        predictionTimestamp: waitPred.prediction_timestamp || analytics.metadata.generated_at,
        factors: {
          "People Ahead": `${waitingAhead} citizens waiting`,
          "Average Duration": `${analytics.service_time_prediction.predicted_service_time_mins} mins per token`,
          "Active Counters": `${activeCounters} active counters`,
          "Traffic Level": analytics.queue_load_forecast.description
        },
        // Complete 14-feature AI Suite
        serviceTimePrediction: analytics.service_time_prediction,
        crowdPrediction: analytics.crowd_prediction,
        queueLoadForecast: analytics.queue_load_forecast,
        bestTimeToVisit: analytics.best_time_to_visit,
        whenShouldILeave: analytics.when_should_i_leave,
        queueHealth: analytics.queue_health,
        bottleneckDetection: analytics.bottleneck_detection,
        counterLoadPrediction: analytics.counter_load_prediction,
        staffCapacityForecast: analytics.staff_capacity_forecast,
        noShowRisk: analytics.no_show_risk,
        queueAbandonmentRisk: analytics.queue_abandonment_risk,
        anomalyDetection: analytics.anomaly_detection,
        aiInsights: analytics.ai_insights
      }
    });

  } catch (error) {
    console.error('Citizen Prediction API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
