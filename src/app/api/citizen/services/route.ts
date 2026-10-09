import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Service } from '@/models/Service';
import { Office } from '@/models/Office';
import { getUserFromCookie } from '@/lib/auth';
import { QueueMetricsService } from '@/lib/queue';

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
    const officeId = searchParams.get('officeId')?.trim();
    const search = searchParams.get('search')?.trim();

    const query: Record<string, unknown> = { status: 'ACTIVE' };

    if (officeId) {
      if (!mongoose.Types.ObjectId.isValid(officeId)) {
        return NextResponse.json({ success: false, message: 'Invalid office ID' }, { status: 400 });
      }
      query.officeId = new mongoose.Types.ObjectId(officeId);
    }

    if (search) {
      const sanitized = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: sanitized, $options: 'i' } },
        { description: { $regex: sanitized, $options: 'i' } }
      ];
    }

    const services = await Service.find(query).lean();

    const mapped = await Promise.all(
      services.map(async (s) => {
        const metrics = await QueueMetricsService.getServiceMetrics(s.officeId, s._id);
        return {
          _id: s._id,
          name: s.name,
          code: s.code,
          description: s.description,
          officeId: s.officeId,
          averageServiceTime: s.averageServiceTime || 5,
          waitingCount: metrics.waitingCount,
          estimatedWaitMinutes: metrics.estimatedWaitMinutes,
          activeCounters: metrics.activeCountersCount,
          queueLoad: metrics.queueLoad.level
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: mapped
    });
  } catch (error) {
    console.error('Citizen Services API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
