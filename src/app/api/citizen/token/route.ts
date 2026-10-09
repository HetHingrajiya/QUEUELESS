import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Token, TokenStatus } from '@/models/Token';
import { User, UserRole } from '@/models/User';
import { Office } from '@/models/Office';
import { Service } from '@/models/Service';
import { Counter, CounterStatus } from '@/models/Counter';
import { QueueEvent } from '@/models/QueueEvent';
import { SystemSettings } from '@/models/SystemSettings';
import { TokenSequence } from '@/models/TokenSequence';
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
    if (!citizen || citizen.status === 'INACTIVE') {
      return NextResponse.json({ success: false, message: 'Citizen account not found or inactive.' }, { status: 401 });
    }

    const body = await req.json();
    const { officeId, serviceId } = body;

    if (!officeId || !mongoose.Types.ObjectId.isValid(officeId) || !serviceId || !mongoose.Types.ObjectId.isValid(serviceId)) {
      return NextResponse.json({ success: false, message: 'Valid Office ID and Service ID are required' }, { status: 400 });
    }

    const office = await Office.findById(officeId);
    if (!office || office.status === 'INACTIVE' || (office as any).isActive === false) {
      return NextResponse.json({ success: false, message: 'Office not found or currently inactive', errorCode: 'OFFICE_INACTIVE' }, { status: 404 });
    }

    // Verify Office Operating Schedule
    if (office.workingHours && office.workingHours.length > 0) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
      const currentDay = dayNames[new Date().getDay()];
      const todayHours = office.workingHours.find((w: any) => w.day === currentDay);
      if (todayHours && !todayHours.isOpen) {
        return NextResponse.json({
          success: false,
          message: `The office is closed on ${currentDay} according to its official operating schedule.`,
          errorCode: 'OFFICE_CLOSED'
        }, { status: 400 });
      }
    }
    
    const service = await Service.findById(serviceId);
    if (!service || service.status === 'INACTIVE' || (service as any).isActive === false) {
      return NextResponse.json({ success: false, message: 'Service not found or currently disabled', errorCode: 'SERVICE_INACTIVE' }, { status: 404 });
    }

    if (service.officeId.toString() !== office._id.toString()) {
      return NextResponse.json({ success: false, message: 'The requested service does not belong to the selected office.' }, { status: 400 });
    }

    if (office.organizationId && service.organizationId && office.organizationId.toString() !== service.organizationId.toString()) {
      return NextResponse.json({ success: false, message: 'Invalid organization relationship between office and service.' }, { status: 400 });
    }

    // Verify Active Counters Eligibility (must have at least 1 eligible active counter for this service)
    const eligibleCountersCount = await Counter.countDocuments({
      officeId: office._id,
      status: CounterStatus.ACTIVE,
      $or: [
        { serviceIds: { $exists: false } },
        { serviceIds: { $size: 0 } },
        { serviceIds: service._id }
      ]
    });

    if (eligibleCountersCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'No active counters are currently open to serve this service. Please check back during operating counter hours.',
        errorCode: 'NO_ACTIVE_COUNTERS'
      }, { status: 400 });
    }

    // Check if citizen already has a conflicting active token for this office
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

    // Check if citizen already has an active token for this exact service
    const existingSameServiceToken = await Token.findOne({
      citizenId: citizen._id,
      serviceId: service._id,
      status: { $in: ACTIVE_TOKEN_STATUSES }
    });

    if (existingSameServiceToken) {
      return NextResponse.json({
        success: false,
        message: `You already have an active token (${existingSameServiceToken.tokenNumber}) for ${service.name}. Please complete or cancel it first.`,
        errorCode: 'ACTIVE_TOKEN_EXISTS',
        data: { activeTokenId: existingSameServiceToken._id }
      }, { status: 400 });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Verify Daily Token Limit for this service
    if (typeof service.dailyTokenLimit === 'number' && service.dailyTokenLimit > 0) {
      const totalCreatedToday = await Token.countDocuments({
        serviceId: service._id,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      if (totalCreatedToday >= service.dailyTokenLimit) {
        return NextResponse.json({
          success: false,
          message: `Daily booking limit (${service.dailyTokenLimit} tokens) has been reached for ${service.name}. Please book tomorrow.`,
          errorCode: 'DAILY_LIMIT_REACHED'
        }, { status: 400 });
      }
    }

    const dateKey = startOfDay.toISOString().split('T')[0];

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

    // Atomic sequence allocation to guarantee concurrency safety
    const sequenceDoc = await TokenSequence.findOneAndUpdate(
      { officeId: office._id, date: dateKey },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const prefix = service.code ? service.code.substring(0, 1).toUpperCase() : 'A';
    const number = sequenceDoc.seq.toString().padStart(3, '0');
    const tokenNumber = `${prefix}-${number}`;

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
      queuePosition: sequenceDoc.seq
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
      socket.emit('queue:action', { action: 'TOKEN_CREATED', officeId: office._id.toString(), tokenId: newToken._id.toString() });
      socket.emit('queue:updated', { officeId: office._id.toString(), serviceId: service._id.toString() });
      socket.emit('notification:new', {
        userId: citizen._id.toString(),
        officeId: office._id.toString(),
        tokenId: newToken._id.toString(),
        type: 'TOKEN',
        title: 'Token Generated Successfully',
        message: `Your token ${newToken.tokenNumber} for ${service.name} at ${office.name} is confirmed.`,
        createdAt: new Date().toISOString()
      });
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
