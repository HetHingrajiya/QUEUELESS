import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Token, TokenStatus } from '@/models/Token';
import { User, UserRole } from '@/models/User';
import { Office } from '@/models/Office';
import { Service } from '@/models/Service';
import { QueueEvent } from '@/models/QueueEvent';
import { SystemSettings } from '@/models/SystemSettings';
import { createAuditLog } from '@/lib/auditLogger';
import { 
  ACTIVE_TOKEN_STATUSES, 
  WAITING_TOKEN_STATUSES, 
  QueueEventTypes, 
  QueueMetricsService
} from '@/lib/queue';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const user = await getUserFromCookie();
    if (!user || !user.userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Please login as a citizen.' }, { status: 401 });
    }
    if (user.role !== UserRole.CITIZEN) {
      return NextResponse.json({ success: false, message: 'Forbidden. Citizen role required.' }, { status: 403 });
    }

    const citizen = await User.findById(user.userId);
    if (!citizen || !citizen.isActive) {
      return NextResponse.json({ success: false, message: 'Citizen account not found or inactive.' }, { status: 401 });
    }

    const body = await req.json();
    const { officeId, serviceId } = body;

    if (!officeId || !mongoose.Types.ObjectId.isValid(officeId) || !serviceId || !mongoose.Types.ObjectId.isValid(serviceId)) {
      return NextResponse.json({ success: false, message: 'Valid Office ID and Service ID are required' }, { status: 400 });
    }

    const office = await Office.findById(officeId);
    if (!office || office.isActive === false) {
      return NextResponse.json({ success: false, message: 'Office not found or currently inactive' }, { status: 404 });
    }
    
    const service = await Service.findById(serviceId);
    if (!service || service.isActive === false) {
      return NextResponse.json({ success: false, message: 'Service not found or currently inactive' }, { status: 404 });
    }

    if (service.officeId.toString() !== office._id.toString()) {
      return NextResponse.json({ success: false, message: 'The requested service does not belong to the selected office.' }, { status: 400 });
    }

    if (office.organizationId && service.organizationId && office.organizationId.toString() !== service.organizationId.toString()) {
      return NextResponse.json({ success: false, message: 'Invalid organization relationship between office and service.' }, { status: 400 });
    }

    // Check if citizen already has a conflicting active token
    const existingActiveToken = await Token.findOne({
      citizenId: citizen._id,
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

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Get number of tokens today to generate tokenNumber like A-001
    const todaysTokens = await Token.countDocuments({
      officeId,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    
    const prefix = service.code ? service.code.substring(0, 1).toUpperCase() : 'A';
    const number = (todaysTokens + 1).toString().padStart(3, '0');
    const tokenNumber = `${prefix}-${number}`;

    const waitingTokensCount = await Token.countDocuments({
      officeId,
      serviceId,
      status: { $in: WAITING_TOKEN_STATUSES },
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

    const activeCountersCount = await QueueMetricsService.getActiveCountersCount(office._id, service._id);
    const averageServiceTime = await QueueMetricsService.getAverageServiceTime(office._id, service._id);
    const estimatedWaitTime = QueueMetricsService.calculateEstimatedWaitTime(
      waitingTokensCount,
      averageServiceTime,
      activeCountersCount
    );
    const recommendedArrivalTime = QueueMetricsService.calculateRecommendedArrivalTime(
      estimatedWaitTime,
      checkInBuffer
    );

    const newToken = await Token.create({
      tokenNumber,
      citizenId: citizen._id,
      officeId: office._id,
      organizationId: office.organizationId,
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
      eventType: QueueEventTypes.CREATED
    });

    await createAuditLog({
      action: 'CREATE_TOKEN',
      module: 'QUEUE',
      description: `Citizen generated token ${newToken.tokenNumber} for ${service.name}`,
      entityType: 'Token',
      entityId: newToken._id.toString(),
      userId: citizen._id.toString(),
      userRole: citizen.role,
      officeId: office._id.toString(),
      request: req
    });

    try {
      const { sendWebPush } = await import('@/lib/push');
      await sendWebPush(
        citizen._id.toString(),
        'Token Generated Successfully',
        `Your token ${newToken.tokenNumber} for ${service.name} at ${office.name} is confirmed.`,
        `/citizen/queue/${newToken._id}`
      );
    } catch (pushErr) {
      console.error('Failed to send push on token generation', pushErr);
    }

    // In-app Notification for citizen
    try {
      const { Notification } = await import('@/models/Notification');
      await Notification.create({
        userId: citizen._id,
        officeId: office._id,
        tokenId: newToken._id,
        type: 'SUCCESS',
        title: 'Token Generated Successfully',
        message: `Your token ${newToken.tokenNumber} for ${service.name} at ${office.name} is confirmed.`,
        channel: 'IN_APP',
        isRead: false
      });
    } catch (notifErr) {
      console.error('Failed to create in-app notification', notifErr);
    }

    // Socket.IO event broadcast
    try {
      const { getSocket } = await import('@/lib/socketClient');
      const socket = getSocket();
      socket.emit('queue:action', { action: 'TOKEN_CREATED', officeId: office._id, tokenId: newToken._id });
      socket.emit('queue:updated');
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Token generated successfully',
      data: {
        tokenId: newToken._id,
        tokenNumber: newToken.tokenNumber
      }
    });

  } catch (error) {
    console.error('Token Generation API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
