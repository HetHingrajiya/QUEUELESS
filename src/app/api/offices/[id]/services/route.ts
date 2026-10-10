import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Service } from '@/models/Service';
import { getUserFromCookie } from '@/lib/auth';
import { QueueMetricsService } from '@/lib/queue';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || !user.userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid office ID' }, { status: 400 });
    }

    const services = await Service.find({
      officeId: new mongoose.Types.ObjectId(id),
      status: 'ACTIVE',
    }).lean();

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
        };
      })
    );

    return NextResponse.json({ success: true, data: mapped });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
