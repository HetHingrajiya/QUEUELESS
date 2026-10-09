import { NextResponse, NextRequest } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Token, TokenStatus, IToken } from '@/models/Token';
import { Counter, CounterStatus } from '@/models/Counter';
import { User, UserRole } from '@/models/User';
import { QueueEvent } from '@/models/QueueEvent';
import { SystemSettings } from '@/models/SystemSettings';


export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const user = await getUserFromCookie();
    const role = user?.role;
    
    if (role !== UserRole.STAFF) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { action, tokenId, targetCounterId, targetCounterNumber } = body;

    if (!user?.userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const staffUser = await User.findById(user.userId).lean();
    if (!staffUser || !staffUser.officeId || staffUser.status !== 'ACTIVE') {
       return NextResponse.json({ success: false, message: 'Active staff account and office assignment are required' }, { status: 403 });
    }

    // Never silently assign an unassigned staff member to another staff member's counter.
    let counter = await Counter.findOne({ staffId: staffUser._id, officeId: staffUser.officeId }).lean();
    if (!counter && staffUser.counterId) {
      counter = await Counter.findOne({ _id: staffUser.counterId, officeId: staffUser.officeId }).lean();
    }
    if (!counter) {
      return NextResponse.json({ success: false, message: 'No counter is assigned to your staff account. Ask an administrator to assign one.' }, { status: 403 });
    }

    const officeId = staffUser.officeId;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let token: IToken | null = null;

    if (action === 'CALL_NEXT' || action === 'CALL' || action === 'CALL_SPECIFIC') {
      const settings = await SystemSettings.findOne();
      const noShowTimeout = settings?.noShowTimeout || 5;

      // Atomically transition timed-out calls and persist their lifecycle events.
      const timeoutThreshold = new Date(Date.now() - (noShowTimeout * 60000));
      const timedOutTokens = await Token.find({
        counterId: counter._id,
        officeId,
        status: TokenStatus.CALLED,
        callTime: { $lt: timeoutThreshold }
      }).select('_id citizenId officeId serviceId tokenNumber organizationId').limit(100).lean();

      for (const timedOut of timedOutTokens) {
        const noShowAt = new Date();
        const noShowToken = await Token.findOneAndUpdate(
          { _id: timedOut._id, counterId: counter._id, status: TokenStatus.CALLED, callTime: { $lt: timeoutThreshold } },
          { $set: { status: TokenStatus.NO_SHOW, endTime: noShowAt } },
          { new: true }
        );
        if (!noShowToken) continue;

        try {
          await QueueEvent.create({
            tokenId: noShowToken._id,
            officeId: noShowToken.officeId,
            serviceId: noShowToken.serviceId,
            eventType: 'NO_SHOW',
            counterId: noShowToken.counterId || counter._id,
            staffId: staffUser._id,
            metadata: { reason: 'CALL_TIMEOUT', timeoutMinutes: noShowTimeout }
          });
        } catch (eventErr) {
          console.error('Failed to persist automatic no-show queue event:', eventErr);
        }

        if (noShowToken.citizenId) {
          const citizenIdStr = noShowToken.citizenId.toString();
          const notificationTitle = 'Token Marked No-Show';
          const notificationMessage = `Token ${noShowToken.tokenNumber} was marked as No-Show because it was not started within ${noShowTimeout} minutes. Please contact the office if you believe this is incorrect.`;
          try {
            const { Notification } = await import('@/models/Notification');
            await Notification.create({
              userId: noShowToken.citizenId,
              organizationId: (noShowToken as any).organizationId,
              officeId: noShowToken.officeId,
              tokenId: noShowToken._id,
              type: 'TOKEN',
              title: notificationTitle,
              message: notificationMessage,
              channel: 'IN_APP',
              isRead: false
            });
          } catch (notificationErr) {
            console.error('Failed to persist automatic no-show notification:', notificationErr);
          }
          try {
            const { sendWebPush } = await import('@/lib/push');
            await sendWebPush(citizenIdStr, notificationTitle, notificationMessage, `/citizen/queue/${noShowToken._id}`);
          } catch (pushErr) {
            console.error('Failed to send automatic no-show push:', pushErr);
          }
          try {
            const { getSocket } = await import('@/lib/socketClient');
            const socket = getSocket();
            const payload = {
              tokenId: noShowToken._id.toString(),
              tokenNumber: noShowToken.tokenNumber,
              officeId: noShowToken.officeId.toString(),
              serviceId: noShowToken.serviceId?.toString(),
              status: noShowToken.status,
              action: 'NO_SHOW'
            };
            socket.emit('queue:action', payload);
            socket.emit('queue:updated', payload);
            socket.emit('token:no_show', payload);
            socket.emit('notification:new', {
              userId: citizenIdStr,
              officeId: payload.officeId,
              tokenId: payload.tokenId,
              type: 'TOKEN',
              title: notificationTitle,
              message: notificationMessage,
              createdAt: noShowAt.toISOString()
            });
          } catch (socketErr) {
            console.error('Failed to broadcast automatic no-show update:', socketErr);
          }
        }
      }

      if (tokenId) {
        const callableStatuses = action === 'RECALL'
          ? [TokenStatus.CALLED]
          : [TokenStatus.WAITING, TokenStatus.CHECKED_IN];
        const callFilter: Record<string, unknown> = {
          _id: tokenId,
          officeId,
          status: { $in: callableStatuses }
        };
        if (counter.serviceIds?.length) {
          callFilter.serviceId = { $in: counter.serviceIds };
        } else if (staffUser.serviceId) {
          callFilter.serviceId = staffUser.serviceId;
        }
        token = await Token.findOneAndUpdate(
          callFilter,
          {
            $set: {
              status: TokenStatus.CALLED,
              counterId: counter._id,
              staffId: staffUser._id,
              callTime: new Date()
            }
          },
          { new: true }
        );
      } else {
        const filter: any = {
          officeId,
          status: { $in: [TokenStatus.WAITING, TokenStatus.CHECKED_IN] },
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        };
        if (counter.serviceIds && counter.serviceIds.length > 0) {
          filter.serviceId = { $in: counter.serviceIds };
        } else if (staffUser.serviceId) {
          filter.serviceId = staffUser.serviceId;
        }
        token = await Token.findOneAndUpdate(
          filter,
          {
            $set: {
              status: TokenStatus.CALLED,
              counterId: counter._id,
              staffId: staffUser._id,
              callTime: new Date()
            }
          },
          { sort: { priority: -1, createdAt: 1 }, new: true }
        );
      }

      if (!token) {
        return NextResponse.json({ success: false, message: 'No waiting tokens in queue' }, { status: 404 });
      }

      await Counter.findByIdAndUpdate(counter._id, { status: CounterStatus.ACTIVE });

    } else if (tokenId) {
      token = await Token.findOne({
        _id: tokenId,
        officeId: staffUser.officeId,
      });
      if (!token) return NextResponse.json({ success: false, message: 'Token not found' }, { status: 404 });

      const allowedStatusesByAction: Record<string, string[]> = {
        START: [TokenStatus.CALLED],
        START_SERVICE: [TokenStatus.CALLED],
        COMPLETE: [TokenStatus.SERVING],
        COMPLETE_SERVICE: [TokenStatus.SERVING],
        SKIP: [TokenStatus.WAITING, TokenStatus.CHECKED_IN, TokenStatus.CALLED],
        NO_SHOW: [TokenStatus.CALLED],
        RECALL: [TokenStatus.CALLED],
        TRANSFER: [TokenStatus.WAITING, TokenStatus.CHECKED_IN, TokenStatus.CALLED]
      };
      const allowedStatuses = allowedStatusesByAction[action];
      if (allowedStatuses && !allowedStatuses.includes(token.status)) {
        return NextResponse.json({
          success: false,
          message: `Action ${action} is not allowed for a token in ${token.status} status.`,
          errorCode: 'TOKEN_STATE_CHANGED'
        }, { status: 409 });
      }
      if (counter.serviceIds?.length &&
          !counter.serviceIds.some((serviceId: any) => serviceId.toString() === token.serviceId?.toString())) {
        return NextResponse.json({ success: false, message: 'Your assigned counter cannot process this token service.' }, { status: 403 });
      }
      if (!counter.serviceIds?.length && staffUser.serviceId &&
          staffUser.serviceId.toString() !== token.serviceId?.toString()) {
        return NextResponse.json({ success: false, message: 'This token is outside your assigned service.' }, { status: 403 });
      }

      const now = new Date();
      token.counterId = counter._id;
      token.staffId = staffUser._id;

      switch (action) {
        case 'START':
        case 'START_SERVICE':
          token.status = TokenStatus.SERVING;
          token.startTime = now;
          break;
        case 'COMPLETE':
        case 'COMPLETE_SERVICE':
          token.status = TokenStatus.COMPLETED;
          token.completionTime = now;
          token.endTime = now;
          if (token.startTime) {
            token.processingTime = Math.floor((now.getTime() - new Date(token.startTime).getTime()) / 1000);
          }
          await Counter.findByIdAndUpdate(counter._id, { status: CounterStatus.ACTIVE });
          break;
        case 'SKIP':
          token.status = TokenStatus.SKIPPED;
          token.endTime = now;
          await Counter.findByIdAndUpdate(counter._id, { status: CounterStatus.ACTIVE });
          break;
        case 'NO_SHOW':
          token.status = TokenStatus.NO_SHOW;
          token.endTime = now;
          await Counter.findByIdAndUpdate(counter._id, { status: CounterStatus.ACTIVE });
          break;
        case 'RECALL':
          token.status = TokenStatus.CALLED;
          token.callTime = now;
          break;
        case 'TRANSFER': {
          let newCounter = null;
          if (targetCounterId) {
            newCounter = await Counter.findOne({ _id: targetCounterId, officeId: staffUser.officeId }).lean();
          } else if (targetCounterNumber) {
            newCounter = await Counter.findOne({ officeId: staffUser.officeId, number: targetCounterNumber }).lean();
          }
          if (!newCounter) {
            return NextResponse.json({ success: false, message: 'Target counter not found in your office' }, { status: 400 });
          }
          if (newCounter.serviceIds?.length && token.serviceId &&
              !newCounter.serviceIds.some((serviceId: any) => serviceId.toString() === token.serviceId.toString())) {
            return NextResponse.json({ success: false, message: 'Target counter is not configured for this service' }, { status: 400 });
          }
          const prevCounterName = counter.name || `Counter ${counter.number || 1}`;
          token.counterId = newCounter._id;
          token.status = TokenStatus.CALLED;
          token.callTime = now;
          token.notes = `Transferred from ${prevCounterName}`;
          break;
        }
        default:
          return NextResponse.json({ success: false, message: `Invalid action: ${action}` }, { status: 400 });
      }

      await token.save();
    } else {
      return NextResponse.json({ success: false, message: 'Token ID required for this action' }, { status: 400 });
    }

    // Record Queue Event
    if (token) {
      await QueueEvent.create({
        tokenId: token._id,
        officeId: token.officeId,
        serviceId: token.serviceId,
        eventType: ((action === 'CALL_NEXT' || action === 'CALL' || action === 'CALL_SPECIFIC' || action === 'RECALL') ? 'CALLED' : (action === 'START' || action === 'START_SERVICE') ? 'SERVING' : (action === 'COMPLETE' || action === 'COMPLETE_SERVICE') ? 'COMPLETED' : action === 'SKIP' ? 'SKIPPED' : action === 'NO_SHOW' ? 'NO_SHOW' : action === 'TRANSFER' ? 'TRANSFERRED' : String(action)),
        counterId: token.counterId || counter._id,
        staffId: staffUser._id,
        metadata: action === 'TRANSFER' ? { previousCounterName: counter.name || `Counter ${counter.number || 1}`, transferTime: new Date() } : undefined,
      });

      const { createAuditLog } = await import('@/lib/auditLogger');
      await createAuditLog({
        action: 'UPDATE',
        module: 'Queue',
        description: `Token ${token.tokenNumber} updated to ${token.status} by ${staffUser.fullName}`,
        entityType: 'Token',
        entityId: token._id.toString(),
        newData: token.toObject ? token.toObject() : token,
        status: 'SUCCESS',
        request: req,
      });

      // Citizen lifecycle notifications are persisted independently from push delivery.
      if (token.citizenId) {
        const citizenIdStr = token.citizenId.toString();
        const tokenIdStr = token._id.toString();
        const officeIdStr = token.officeId?.toString();
        const url = action === 'COMPLETE' || action === 'COMPLETE_SERVICE'
          ? '/citizen/token-history'
          : `/citizen/queue/${tokenIdStr}`;

        let notifTitle = 'Queue Update';
        let notifMsg = `Token ${token.tokenNumber} status updated to ${token.status}.`;
        let pushTitle = notifTitle;
        let notifType = 'TOKEN';

        if (action === 'CALL_NEXT' || action === 'CALL' || action === 'CALL_SPECIFIC' || action === 'RECALL') {
          notifTitle = 'Your Turn — Token Called';
          notifMsg = `Token ${token.tokenNumber} has been called at ${counter.name || `Counter ${counter.number || ''}`}. Please proceed to the counter.`;
          pushTitle = 'It is your turn!';
        } else if (action === 'START' || action === 'START_SERVICE') {
          notifTitle = 'Service Started';
          notifMsg = `Service for token ${token.tokenNumber} has started.`;
          pushTitle = notifTitle;
        } else if (action === 'COMPLETE' || action === 'COMPLETE_SERVICE') {
          notifTitle = 'Service Completed';
          notifMsg = `Your service for token ${token.tokenNumber} is complete. Thank you!`;
          pushTitle = notifTitle;
        } else if (action === 'NO_SHOW') {
          notifTitle = 'Token Marked No-Show';
          notifMsg = `Token ${token.tokenNumber} was marked as No-Show. Please contact the office if you believe this is incorrect.`;
          pushTitle = notifTitle;
        } else if (action === 'SKIP') {
          notifTitle = 'Token Skipped';
          notifMsg = `Token ${token.tokenNumber} was skipped by counter staff.`;
          pushTitle = notifTitle;
        } else if (action === 'TRANSFER') {
          notifTitle = 'Token Transferred';
          notifMsg = `Token ${token.tokenNumber} has been transferred to another counter.`;
          pushTitle = notifTitle;
        }

        try {
          const { Notification } = await import('@/models/Notification');
          await Notification.create({
            userId: token.citizenId,
            organizationId: (token as any).organizationId,
            officeId: token.officeId,
            tokenId: token._id,
            type: notifType,
            title: notifTitle,
            message: notifMsg,
            channel: 'IN_APP',
            isRead: false
          });
        } catch (notifErr) {
          console.error('Failed to persist citizen lifecycle notification:', notifErr);
        }

        try {
          const { sendWebPush } = await import('@/lib/push');
          await sendWebPush(citizenIdStr, pushTitle, notifMsg, url);
        } catch (pushErr) {
          console.error('Failed to send citizen lifecycle push notification:', pushErr);
        }

        // Broadcast queue state and private notification to the citizen's authenticated room.
        try {
          const { getSocket } = await import('@/lib/socketClient');
          const socket = getSocket();
          const eventPayload = {
            action,
            tokenId: tokenIdStr,
            tokenNumber: token.tokenNumber,
            officeId: officeIdStr,
            serviceId: token.serviceId?.toString(),
            counterName: counter.name,
            counterNumber: counter.number,
            status: token.status
          };

          socket.emit('queue:action', eventPayload);
          socket.emit('queue:updated', eventPayload);

          if (action === 'CALL_NEXT' || action === 'CALL' || action === 'CALL_SPECIFIC' || action === 'RECALL') {
            socket.emit('token:called', eventPayload);
          } else if (action === 'START' || action === 'START_SERVICE') {
            socket.emit('token:serving', eventPayload);
          } else if (action === 'COMPLETE' || action === 'COMPLETE_SERVICE') {
            socket.emit('token:completed', eventPayload);
          } else if (action === 'SKIP' || action === 'NO_SHOW') {
            socket.emit('token:no_show', eventPayload);
          } else if (action === 'TRANSFER') {
            socket.emit('token:called', eventPayload);
            socket.emit('token:transferred', eventPayload);
          }

          socket.emit('notification:new', {
            userId: citizenIdStr,
            officeId: officeIdStr,
            tokenId: tokenIdStr,
            type: notifType,
            title: notifTitle,
            message: notifMsg,
            createdAt: new Date().toISOString()
          });
        } catch (socketErr) {
          console.error('Failed to broadcast citizen lifecycle update:', socketErr);
        }
      }
    }

    return NextResponse.json({ success: true, data: token });

  } catch (error: any) {
    console.error('Staff Action API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
