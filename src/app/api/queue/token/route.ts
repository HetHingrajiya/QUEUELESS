import { NextResponse } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Token, TokenStatus } from '@/models/Token';
import { User, UserRole } from '@/models/User';
import { Service } from '@/models/Service';
import { Counter } from '@/models/Counter';
import { SystemSettings } from '@/models/SystemSettings';

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const user = await getUserFromCookie();
    const userId = user?.userId;
    
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { officeId, serviceId } = body;

    if (!officeId || !serviceId) {
      return NextResponse.json({ success: false, message: 'Office ID and Service ID are required' }, { status: 400 });
    }

    // Rule 1: A citizen cannot have multiple active tokens for the same service.
    const existingActiveToken = await Token.findOne({
      citizenId: userId,
      serviceId,
      status: { $in: [TokenStatus.WAITING, TokenStatus.CALLED, TokenStatus.CHECKED_IN] }
    });

    if (existingActiveToken) {
      return NextResponse.json({ 
        success: false, 
        message: 'You already have an active token for this service',
        errorCode: 'ACTIVE_TOKEN_EXISTS'
      }, { status: 400 });
    }

    // Generate Token Number logic (simplified for demo)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tokenCount = await Token.countDocuments({ 
      officeId, 
      serviceId,
      createdAt: { $gte: today } 
    });

    // E.g., A-1, A-2... (Would use Service Code in reality, like DL-145)
    const service = await Service.findById(serviceId);
    if (!service) {
      return NextResponse.json({ success: false, message: 'Service not found' }, { status: 404 });
    }

    const tokenNumber = `${service.code}-${(tokenCount + 1).toString().padStart(3, '0')}`;

    // AI Prediction simple logic
    const waitingTokensCount = await Token.countDocuments({
      officeId,
      serviceId,
      status: { $in: [TokenStatus.WAITING, TokenStatus.CHECKED_IN] }
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


    const activeCounters = await Counter.countDocuments({
      officeId,
      serviceId,
      status: 'ACTIVE'
    });

    const divisor = activeCounters > 0 ? activeCounters : 1;
    const estimatedWaitTime = Math.ceil((waitingTokensCount * service.averageServiceTime) / divisor);

    const recommendedArrivalTime = new Date(Date.now() + (estimatedWaitTime * 60000) - (checkInBuffer * 60000)); 

    const newToken = await Token.create({
      tokenNumber,
      citizenId: userId,
      officeId,
      serviceId,
      status: TokenStatus.WAITING,
      estimatedWaitTime,
      recommendedArrivalTime,
      queuePosition: waitingTokensCount + 1,
    });

    const { createAuditLog } = await import('@/lib/auditLogger');
    await createAuditLog({
      action: 'CREATE',
      module: 'Queue',
      description: `Token ${tokenNumber} generated for citizen ${userId}`,
      entityType: 'Token',
      entityId: newToken._id.toString(),
      newData: newToken.toObject(),
      status: 'SUCCESS',
      request,
    });

    return NextResponse.json({
      success: true,
      message: 'Token generated successfully',
      data: {
        token: newToken,
        peopleAhead: waitingTokensCount,
        estimatedWaitTime,
        recommendedArrivalTime
      }
    });

  } catch (error) {
    console.error('Create token error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
