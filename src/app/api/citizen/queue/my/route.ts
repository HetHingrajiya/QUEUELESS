import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
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

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    interface PopulatedTokenDoc {
      _id: mongoose.Types.ObjectId;
      tokenNumber: string;
      status: string;
      serviceId?: { name?: string; averageServiceTime?: number };
      officeId?: { name?: string; address?: string; latitude?: number; longitude?: number };
      counterId?: { name?: string; number?: number };
      createdAt: Date;
      checkInTime?: Date;
      callTime?: Date;
    }

    const activeTokens = await Token.find({
      citizenId: user.userId,
      status: { $in: ACTIVE_TOKEN_STATUSES }
    })
    .populate('officeId', 'name address latitude longitude')
    .populate('serviceId', 'name averageServiceTime')
    .populate('counterId', 'name number')
    .sort({ createdAt: -1 })
    .lean() as unknown as PopulatedTokenDoc[];

    const results = await Promise.all(
      activeTokens.map(async (tok) => {
        const metrics = await QueueMetricsService.getTokenPositionMetrics(tok._id, user.userId);

        const peopleAhead = metrics?.peopleAhead ?? 0;
        const estimatedWaitMin = metrics?.estimatedWaitMinutes ?? 0;
        const nowServing = metrics?.nowServing || 'None';

        return {
          id: tok._id,
          tokenNumber: tok.tokenNumber,
          serviceName: tok.serviceId?.name || 'Public Service',
          officeName: tok.officeId?.name || 'Government Office',
          officeAddress: tok.officeId?.address,
          status: tok.status,
          peopleAhead,
          estimatedWaitMin,
          nowServing,
          counterNumber: tok.counterId ? tok.counterId.name : 'Unassigned',
          date: new Date(tok.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          checkInTime: tok.checkInTime,
          callTime: tok.callTime,
          queueLoad: metrics?.queueLoad.level || 'LOW'
        };
      })
    );

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('Citizen My Queue GET error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
