import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Office } from '@/models/Office';
import { Token } from '@/models/Token';
import { getUserFromCookie } from '@/lib/auth';
import { ACTIVE_TOKEN_STATUSES, QueueMetricsService } from '@/lib/queue';

export async function GET() {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || !user.userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    interface PopulatedHomeTokenDoc {
      _id: mongoose.Types.ObjectId;
      tokenNumber: string;
      status: string;
      serviceId?: { name?: string };
      officeId?: { name?: string };
    }

    // 1. Fetch active token for the citizen
    const activeTokenDoc = await Token.findOne({
      citizenId: user.userId,
      status: { $in: ACTIVE_TOKEN_STATUSES }
    }).populate('officeId', 'name').populate('serviceId', 'name').sort({ createdAt: -1 }).lean() as unknown as PopulatedHomeTokenDoc | null;

    let activeToken = null;
    if (activeTokenDoc) {
      const positionMetrics = await QueueMetricsService.getTokenPositionMetrics(activeTokenDoc._id, user.userId);
      activeToken = {
        id: activeTokenDoc._id,
        tokenNumber: activeTokenDoc.tokenNumber,
        status: activeTokenDoc.status,
        serviceName: activeTokenDoc.serviceId?.name || 'Unknown Service',
        officeName: activeTokenDoc.officeId?.name || 'Unknown Office',
        peopleAhead: positionMetrics?.peopleAhead ?? 0,
        estimatedWaitMin: positionMetrics?.estimatedWaitMinutes ?? 0,
        nowServing: positionMetrics?.nowServing ?? null
      };
    }

    // 2. Fetch offices and enrich with real queue metrics
    const officesDocs = await Office.find({ status: 'ACTIVE' })
      .select('name address status latitude longitude')
      .limit(5)
      .lean();
    
    const offices = await Promise.all(
      officesDocs.map(async o => {
        const metrics = await QueueMetricsService.getOfficeMetrics(o._id);
        return {
          _id: o._id,
          name: o.name,
          address: o.address,
          status: o.status,
          statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          latitude: o.latitude,
          longitude: o.longitude,
          waitingCount: metrics.waitingCount,
          estimatedWaitMinutes: metrics.estimatedWaitMinutes,
          queueLoad: metrics.queueLoad.level
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        activeToken,
        offices
      }
    });

  } catch (error) {
    console.error('Citizen Home API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
