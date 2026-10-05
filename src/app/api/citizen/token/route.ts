import { NextResponse, NextRequest } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Token, TokenStatus } from '@/models/Token';
import { User } from '@/models/User';
import { Office } from '@/models/Office';
import { Service } from '@/models/Service';
import { QueueEvent } from '@/models/QueueEvent';
import { SystemSettings } from '@/models/SystemSettings';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const user = await getUserFromCookie();
    const userId = user?.userId;
    
    // For demo/dev purposes, if no auth, we'll try to find a default citizen
    let citizen = null;
    if (userId) {
      citizen = await User.findById(userId);
    }
    
    if (!citizen) {
      citizen = await User.findOne({ role: 'CITIZEN' });
      if (!citizen) {
        return NextResponse.json({ success: false, message: 'No citizen found' }, { status: 401 });
      }
    }

    const body = await req.json();
    const { officeId, serviceId } = body;

    if (!officeId || !serviceId) {
      return NextResponse.json({ success: false, message: 'Office ID and Service ID are required' }, { status: 400 });
    }

    const office = await Office.findById(officeId);
    if (!office) return NextResponse.json({ success: false, message: 'Office not found' }, { status: 404 });
    
    const service = await Service.findById(serviceId);
    if (!service) return NextResponse.json({ success: false, message: 'Service not found' }, { status: 404 });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Get number of tokens today to generate tokenNumber like A-001
    const todaysTokens = await Token.countDocuments({
      officeId,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    
    // Generate token number (e.g., A-145)
    // Could prefix based on service code
    const prefix = service.code ? service.code.substring(0, 1).toUpperCase() : 'A';
    const number = (todaysTokens + 1).toString().padStart(3, '0');
    const tokenNumber = `${prefix}-${number}`;

    const waitingTokensCount = await Token.countDocuments({
      officeId,
      serviceId,
      status: { $in: [TokenStatus.WAITING, TokenStatus.CHECKED_IN] },
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const settings = await SystemSettings.findOne();
    const maxQueueSize = settings?.maxQueueSize || 100;
    const checkInBuffer = settings?.checkInBuffer || 15;

    if (waitingTokensCount >= maxQueueSize) {
      return NextResponse.json({ 
        success: false, 
        message: 'The queue for this service is currently full. Please try again later.',
        errorCode: 'QUEUE_FULL'
      }, { status: 400 });
    }

    const estimatedWaitTime = Math.ceil((waitingTokensCount * (service.averageServiceTime || 10)));
    const recommendedArrivalTime = new Date(Date.now() + (estimatedWaitTime * 60000) - (checkInBuffer * 60000));


    const newToken = await Token.create({
      tokenNumber,
      citizenId: citizen._id,
      officeId: office._id,
      serviceId: service._id,
      status: TokenStatus.WAITING,
      estimatedWaitTime,
      recommendedArrivalTime,
      queuePosition: todaysTokens + 1
    });

    await QueueEvent.create({
      tokenId: newToken._id,
      officeId,
      serviceId,
      eventType: 'token:created'
    });

    return NextResponse.json({
      success: true,
      message: 'Token generated successfully',
      data: {
        tokenId: newToken._id,
        tokenNumber: newToken.tokenNumber
      }
    });

  } catch (error: any) {
    console.error('Token Generation API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
