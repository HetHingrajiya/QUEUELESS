import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Service } from '@/models/Service';
import { Office } from '@/models/Office';
import { getUserFromCookie } from '@/lib/auth';
import { QueueMetricsService } from '@/lib/queue';

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
      return NextResponse.json({ success: false, message: 'Invalid Service ID' }, { status: 400 });
    }

    const service = await Service.findOne({ _id: id, status: 'ACTIVE' }).lean();
    if (!service) {
      return NextResponse.json({ success: false, message: 'Service not found' }, { status: 404 });
    }

    const office = await Office.findOne({ _id: service.officeId, status: 'ACTIVE' }).lean();

    // Get live queue metrics using QueueMetricsService
    const metrics = await QueueMetricsService.getServiceMetrics(service.officeId, id);
    
    // Comprehensive AI Analytics Integration
    const { getComprehensiveQueueAnalytics } = await import('@/lib/ml');
    const analytics = await getComprehensiveQueueAnalytics(
      id, 
      office?._id?.toString() || '', 
      'NORMAL',
      metrics.waitingCount,
      15,
      metrics.estimatedWaitMinutes
    );
    const estimatedTime = (analytics.wait_time_prediction && analytics.wait_time_prediction.prediction_source === 'ML_MODEL')
      ? analytics.wait_time_prediction.estimated_wait_time_mins
      : metrics.estimatedWaitMinutes;

    return NextResponse.json({
      success: true,
      data: {
        service: {
          _id: service._id,
          name: service.name,
          description: service.description,
          averageServiceTime: metrics.averageServiceTimeMinutes
        },
        office: {
          _id: office?._id,
          name: office?.name
        },
        stats: {
          waitingCount: metrics.waitingCount,
          estimatedTime,
          activeCounters: metrics.activeCountersCount,
          queueLoad: metrics.queueLoad.level,
          throughputPerHour: metrics.throughputPerHour
        },
        mlData: analytics
      }
    });

  } catch (error) {
    console.error('Citizen Service Details API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
