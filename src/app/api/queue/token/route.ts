import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Token, TokenStatus } from '@/models/Token';
import { UserRole } from '@/models/User';
import { Service } from '@/models/Service';
import { Office } from '@/models/Office';
import { QueueEvent } from '@/models/QueueEvent';
import { SystemSettings } from '@/models/SystemSettings';
import { createAuditLog } from '@/lib/auditLogger';
import {
  ACTIVE_TOKEN_STATUSES,
  WAITING_TOKEN_STATUSES,
  QueueEventTypes,
  QueueMetricsService
} from '@/lib/queue';

export async function POST(request: Request) {
  try {
    await dbConnect();

    const user = await getUserFromCookie();
    if (!user || !user.userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== UserRole.CITIZEN) {
      return NextResponse.json({ success: false, message: 'Forbidden. Citizen role required.' }, { status: 403 });
    }
    const userId = user.userId;

    const body = await request.json();
    const { officeId, serviceId } = body;

    if (!officeId || !serviceId) {
      return NextResponse.json({ success: false, message: 'Office ID and Service ID are required' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(officeId) || !mongoose.Types.ObjectId.isValid(serviceId)) {
      return NextResponse.json({ success: false, message: 'Invalid office or service ID format' }, { status: 400 });
    }

    const office = await Office.findOne({ _id: officeId, status: 'ACTIVE' }).lean();
    if (!office) {
      return NextResponse.json({ success: false, message: 'Office not found or currently inactive' }, { status: 404 });
    }

    const service = await Service.findOne({ _id: serviceId, status: 'ACTIVE' }).lean();
    if (!service) {
      return NextResponse.json({ success: false, message: 'Service not found or currently inactive' }, { status: 404 });
    }

    if (service.officeId?.toString() !== office._id.toString()) {
      return NextResponse.json({ success: false, message: 'The requested service does not belong to the selected office.' }, { status: 400 });
    }

    if (office.organizationId && service.organizationId && office.organizationId.toString() !== service.organizationId.toString()) {
      return NextResponse.json({ success: false, message: 'Invalid organization relationship between office and service.' }, { status: 400 });
    }

    // A citizen cannot have multiple active tokens for the same office/service
    const existingActiveToken = await Token.findOne({
      citizenId: userId,
      officeId: office._id,
      status: { $in: ACTIVE_TOKEN_STATUSES }
    });

    if (existingActiveToken) {
      return NextResponse.json({
        success: false,
        message: `You already have an active token (${existingActiveToken.tokenNumber}) for this office. Please complete or cancel it first.`,
        errorCode: 'ACTIVE_TOKEN_EXISTS',
        data: { activeTokenId: existingActiveToken._id }
      }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const tokenCount = await Token.countDocuments({
      officeId,
      createdAt: { $gte: today, $lte: endOfDay }
    });

    const prefix = service.code ? service.code.substring(0, 1).toUpperCase() : 'A';
    const tokenNumber = `${prefix}-${(tokenCount + 1).toString().padStart(3, '0')}`;

    const waitingTokensCount = await Token.countDocuments({
      officeId,
      serviceId,
      status: { $in: WAITING_TOKEN_STATUSES },
      createdAt: { $gte: today, $lte: endOfDay }
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

    const activeCounters = await QueueMetricsService.getActiveCountersCount(officeId, serviceId);
    const averageServiceTime = await QueueMetricsService.getAverageServiceTime(officeId, serviceId);

    const estimatedWaitTime = QueueMetricsService.calculateEstimatedWaitTime(
      waitingTokensCount,
      averageServiceTime,
      activeCounters
    );

    const recommendedArrivalTime = QueueMetricsService.calculateRecommendedArrivalTime(estimatedWaitTime, checkInBuffer);

    const newToken = await Token.create({
      tokenNumber,
      citizenId: userId,
      officeId: office._id,
      organizationId: office.organizationId,
      serviceId: service._id,
      status: TokenStatus.WAITING,
      estimatedWaitTime,
      recommendedArrivalTime,
      queuePosition: waitingTokensCount + 1,
    });

    await QueueEvent.create({
      tokenId: newToken._id,
      officeId: office._id,
      serviceId: service._id,
      eventType: QueueEventTypes.CREATED
    });

    await createAuditLog({
      action: 'CREATE_TOKEN',
      module: 'Queue',
      description: `Token ${tokenNumber} generated for citizen ${userId}`,
      entityType: 'Token',
      entityId: newToken._id.toString(),
      userId,
      userRole: user.role,
      officeId: office._id.toString(),
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
