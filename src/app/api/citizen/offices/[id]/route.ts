import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Office } from '@/models/Office';
import { Service } from '@/models/Service';
import { Token } from '@/models/Token';
import { getUserFromCookie } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid office ID' }, { status: 400 });
    }

    const office = await Office.findById(id).lean();
    
    if (!office) {
      return NextResponse.json({ success: false, message: 'Office not found' }, { status: 404 });
    }

    // Get active counters for this office
    const { Counter } = await import('@/models/Counter');
    const activeCounters = await Counter.find({ officeId: id, status: 'ACTIVE' }).lean();
    
    // Collect all serviceIds from active counters
    const activeServiceIds = new Set(
      activeCounters.flatMap((c: { serviceIds?: Array<{ toString(): string }> }) => (c.serviceIds || []).map((sid: { toString(): string }) => sid.toString()))
    );

    // Get services for this office and filter only those that are served by an active counter
    let services = await Service.find({ officeId: id, status: 'ACTIVE' }).lean();
    services = services.filter(service => activeServiceIds.has(service._id.toString()));

    // Map services with live stats
    const servicesWithStats = await Promise.all(services.map(async (service) => {
      // Find total active tokens for this service
      const waitingCount = await Token.countDocuments({
        serviceId: service._id,
        status: { $in: ['WAITING', 'CHECKED_IN'] }
      });
      
      // Simulate estimated time based on average service time
      const estimatedTime = waitingCount * (service.averageServiceTime || 5);

      return {
        _id: service._id,
        name: service.name,
        description: service.description,
        averageServiceTime: service.averageServiceTime,
        waitingCount,
        estimatedTime
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

  } catch (error: any) {
    console.error('Citizen Office Details API error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
