import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
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
    const search = searchParams.get('search')?.trim() || '';

    const query: Record<string, unknown> = { status: 'ACTIVE' };
    
    if (search) {
      const sanitized = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: sanitized, $options: 'i' } },
        { address: { $regex: sanitized, $options: 'i' } }
      ];
    }

    const offices = await Office.find(query)
      .select('name address contactEmail contactPhone status latitude longitude')
      .lean();

    // Enrich offices with real queue metrics
    const mappedOffices = await Promise.all(
      offices.map(async o => {
        const metrics = await QueueMetricsService.getOfficeMetrics(o._id);
        return {
          _id: o._id,
          name: o.name,
          address: o.address,
          phone: o.contactPhone,
          status: o.status,
          latitude: o.latitude,
          longitude: o.longitude,
          statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          waitingCount: metrics.waitingCount,
          estimatedWaitMinutes: metrics.estimatedWaitMinutes,
          activeCountersCount: metrics.activeCountersCount,
          queueLoad: metrics.queueLoad.level
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: mappedOffices
    });

  } catch (error) {
    console.error('Citizen Offices API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
