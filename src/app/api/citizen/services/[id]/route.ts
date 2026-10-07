import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Service } from '@/models/Service';
import { Office } from '@/models/Office';
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
      return NextResponse.json({ success: false, message: 'Invalid service ID' }, { status: 400 });
    }

    const service = await Service.findById(id).lean();
    if (!service) {
      return NextResponse.json({ success: false, message: 'Service not found' }, { status: 404 });
    }

    const office = await Office.findById(service.officeId).lean();

    // Get live stats
    const waitingCount = await Token.countDocuments({
      serviceId: id,
      status: { $in: ['WAITING', 'CHECKED_IN'] }
    });
    
    // Determine active counters for this service (approx for MVP)
    const activeCounters = office?.counters?.filter((c: any) => c.status === 'ACTIVE').length || 1;
    const averageServiceTime = service.averageServiceTime || 5;
    
    // ML Wait Time Prediction Integration
    const { predictWaitTime } = await import('@/lib/ml');
    const mlPrediction = await predictWaitTime(id, office?._id.toString() || '', 'NORMAL');
    const estimatedTime = mlPrediction.estimated_wait_time_mins;

    return NextResponse.json({
      success: true,
      data: {
        service: {
          _id: service._id,
          name: service.name,
          description: service.description,
          averageServiceTime
        },
        office: {
          _id: office?._id,
          name: office?.name
        },
        stats: {
          waitingCount,
          estimatedTime,
          activeCounters
        },
        mlData: mlPrediction // pass to frontend if needed
      }
    });

  } catch (error: any) {
    console.error('Citizen Service Details API error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
