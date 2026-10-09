import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Office } from '@/models/Office';
import { Service } from '@/models/Service';
import { Counter } from '@/models/Counter';
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
      return NextResponse.json({ success: false, message: 'Invalid Office ID' }, { status: 400 });
    }

    const office = await Office.findOne({ _id: id, status: 'ACTIVE' }).lean();
    if (!office) {
      return NextResponse.json({ success: false, message: 'Office not found' }, { status: 404 });
    }

    // Get active counters for this office
    const activeCounters = await Counter.find({ officeId: id, status: 'ACTIVE' }).lean();
    
    // Collect all serviceIds from active counters
    const activeServiceIds = new Set(
      activeCounters.flatMap((c: { serviceIds?: Array<{ toString(): string }> }) => (c.serviceIds || []).map((sid: { toString(): string }) => sid.toString()))
    );

    // Get services for this office and filter only those that are served by an active counter
    let services = await Service.find({ officeId: id, status: 'ACTIVE' }).lean();
    services = services.filter(service => activeServiceIds.has(service._id.toString()));

    // Map services with live stats using QueueMetricsService
    const servicesWithStats = await Promise.all(services.map(async (service) => {
      const metrics = await QueueMetricsService.getServiceMetrics(id, service._id);
      return {
        _id: service._id,
        name: service.name,
        description: service.description,
        averageServiceTime: metrics.averageServiceTimeMinutes,
        waitingCount: metrics.waitingCount,
        estimatedTime: metrics.estimatedWaitMinutes,
        activeCounters: metrics.activeCountersCount,
        queueLoad: metrics.queueLoad.level
      };
    }));

    return NextResponse.json({
      success: true,
      data: {
        office: {
          _id: office._id,
          name: office.name,
          address: office.address,
          status: office.status,
          contactEmail: office.contactEmail,
          contactPhone: office.contactPhone,
          latitude: office.latitude,
          longitude: office.longitude,
          countersCount: office.counters?.length || 0,
        },
        services: servicesWithStats
      }
    });

  } catch (error) {
    console.error('Citizen Office Details API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
