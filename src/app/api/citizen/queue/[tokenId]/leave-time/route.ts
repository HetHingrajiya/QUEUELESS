import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Token } from '@/models/Token';
import { Office } from '@/models/Office';
import { SystemSettings } from '@/models/SystemSettings';
import { getUserFromCookie } from '@/lib/auth';
import { QueueMetricsService } from '@/lib/queue';
import { calculateRealTravelTime } from '@/lib/geo/routing';
import { calculateDepartureAdvisory } from '@/lib/geo/departure';

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

    interface WorkingHourSchedule {
      day: string;
      isOpen: boolean;
      openingTime?: string;
      closingTime?: string;
    }

    interface LeaveTimeOfficeDoc {
      _id: mongoose.Types.ObjectId;
      name?: string;
      latitude?: number;
      longitude?: number;
      openingTime?: string;
      closingTime?: string;
      workingHours?: WorkingHourSchedule[];
    }

    interface LeaveTimeServiceDoc {
      _id: mongoose.Types.ObjectId;
      name?: string;
      averageServiceTime?: number;
    }

    interface LeaveTimeTokenDoc {
      _id: mongoose.Types.ObjectId;
      tokenNumber: string;
      officeId: LeaveTimeOfficeDoc;
      serviceId: LeaveTimeServiceDoc;
    }

    const myToken = await Token.findOne({ _id: tokenId, citizenId: user.userId })
      .populate('serviceId', 'name averageServiceTime')
      .populate('officeId')
      .lean() as unknown as LeaveTimeTokenDoc | null;
    
    if (!myToken) {
      return NextResponse.json({ success: false, message: 'Token not found' }, { status: 404 });
    }

    const office = myToken.officeId;
    const service = myToken.serviceId;

    // 1. Citizen coordinates from query params
    const { searchParams } = new URL(req.url);
    const citizenLatParam = searchParams.get('lat');
    const citizenLngParam = searchParams.get('lng');
    const citizenLat = citizenLatParam !== null ? parseFloat(citizenLatParam) : null;
    const citizenLng = citizenLngParam !== null ? parseFloat(citizenLngParam) : null;

    // 2. Real Queue Wait Calculation
    const metrics = await QueueMetricsService.getTokenPositionMetrics(tokenId, user.userId);
    const predictedWaitMins = metrics?.estimatedWaitMinutes ?? 5;
    const waitingAhead = metrics?.peopleAhead ?? 0;

    // 3. Office Rules & Buffer
    const settings = await SystemSettings.findOne().lean();
    const checkInBufferMinutes = settings?.checkInBuffer ?? 5;

    // Office Working Hours check
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = days[now.getDay()];
    const todaySchedule = office?.workingHours?.find((wh) => wh.day === todayName);
    const officeRules = {
      isOpen: todaySchedule ? todaySchedule.isOpen : true,
      openingTime: todaySchedule?.openingTime || office?.openingTime || '09:00',
      closingTime: todaySchedule?.closingTime || office?.closingTime || '17:00'
    };

    // 4. Real Routing Query
    const routeResult = await calculateRealTravelTime(
      citizenLat,
      citizenLng,
      office?.latitude ?? null,
      office?.longitude ?? null
    );

    // 5. Calculate Departure Advisory
    const advisory = calculateDepartureAdvisory(
      now,
      predictedWaitMins,
      routeResult.travelTimeMinutes,
      routeResult.distanceKm,
      routeResult.provider,
      checkInBufferMinutes,
      officeRules
    );

    return NextResponse.json({
      success: true,
      data: {
        tokenNumber: myToken.tokenNumber,
        officeName: office?.name || 'Office',
        serviceName: service?.name || 'Service',
        waitingAhead,
        ...advisory,
        message: advisory.travelTimeAvailable ? 'Departure window calculated' : 'Travel time unavailable'
      }
    });

  } catch (error) {
    console.error('Citizen Leave Time API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
