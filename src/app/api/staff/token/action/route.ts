import { NextResponse, NextRequest } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Token, TokenStatus } from '@/models/Token';
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
    if (!staffUser || !staffUser.officeId) {
       return NextResponse.json({ success: false, message: 'Staff user or office not found' }, { status: 404 });
    }

    let counter = await Counter.findOne({ staffId: staffUser._id, officeId: staffUser.officeId }).lean();
    if (!counter) {
      counter = await Counter.findOne({ staffId: staffUser._id }).lean();
    }
    if (!counter) {
      // Find an available or existing counter in this office
      counter = await Counter.findOne({ officeId: staffUser.officeId }).lean();
    }
    if (!counter) {
      return NextResponse.json({ success: false, message: 'No counter available in your office' }, { status: 404 });
    }

    const officeId = staffUser.officeId;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let token = null;

    if (action === 'CALL_NEXT' || action === 'CALL' || action === 'CALL_SPECIFIC') {
      const settings = await SystemSettings.findOne();
      const noShowTimeout = settings?.noShowTimeout || 5;

      // Auto NO_SHOW for tokens that were called but never started within the timeout
      const timeoutThreshold = new Date(Date.now() - (noShowTimeout * 60000));
      await Token.updateMany(
        {
          counterId: counter._id,
          status: TokenStatus.CALLED,
          callTime: { $lt: timeoutThreshold }
        },
        { $set: { status: TokenStatus.NO_SHOW, endTime: new Date() } }
      );

      if (tokenId) {
        token = await Token.findOneAndUpdate(
          {
            _id: tokenId,
            officeId
          },
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
            newCounter = await Counter.findById(targetCounterId).lean();
          } else if (targetCounterNumber) {
            newCounter = await Counter.findOne({ officeId: staffUser.officeId, number: targetCounterNumber }).lean();
          }
          const prevCounterName = counter.name || `Counter ${counter.number || 1}`;
          if (newCounter) {
            token.counterId = newCounter._id;
          }
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
        eventType: ((action === 'CALL_NEXT' || action === 'RECALL') ? 'CALLED' : action === 'START_SERVICE' ? 'SERVING' : action === 'COMPLETE' ? 'COMPLETED' : action === 'SKIP' ? 'SKIPPED' : action === 'NO_SHOW' ? 'NO_SHOW' : action === 'TRANSFER' ? 'TRANSFERRED' : String(action)),
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

      // Send Push Notification to Citizen
      if (token.citizenId) {
        const { sendWebPush } = await import('@/lib/push');
        const citizenIdStr = token.citizenId.toString();
        const url = `/citizen/queue/${token._id}`;
        
        try {
          if (action === 'CALL_NEXT' || action === 'RECALL') {
            await sendWebPush(citizenIdStr, 'It is your turn!', `Token ${token.tokenNumber} is now being served at Counter ${counter.name}`, url);
          } else if (action === 'START_SERVICE') {
            await sendWebPush(citizenIdStr, 'Service Started', `Your service for Token ${token.tokenNumber} has started.`, url);
          } else if (action === 'COMPLETE') {
            await sendWebPush(citizenIdStr, 'Service Completed', `Your service for Token ${token.tokenNumber} is complete. Thank you!`, '/citizen/token-history');
          } else if (action === 'SKIP') {
            await sendWebPush(citizenIdStr, 'Token Skipped', `Token ${token.tokenNumber} was skipped by the staff.`, url);
          } else if (action === 'NO_SHOW') {
            await sendWebPush(citizenIdStr, 'No-Show Marked', `Token ${token.tokenNumber} was marked as No-Show.`, url);
          }
          // Create In-App Notification record for citizen
          try {
            const { Notification } = await import('@/models/Notification');
            let notifTitle = 'Queue Update';
            let notifMsg = `Token ${token.tokenNumber} status updated to ${token.status}`;
            let notifType = 'INFO';
            
            if (action === 'CALL_NEXT' || action === 'RECALL') {
              notifTitle = 'Token Called! Your Turn';
              notifMsg = `Token ${token.tokenNumber} is called at ${counter.name}. Please proceed to the counter.`;
              notifType = 'SUCCESS';
            } else if (action === 'START' || action === 'START_SERVICE') {
              notifTitle = 'Service Started';
              notifMsg = `Service for Token ${token.tokenNumber} has started at ${counter.name}.`;
              notifType = 'INFO';
            } else if (action === 'COMPLETE' || action === 'COMPLETE_SERVICE') {
              notifTitle = 'Service Completed';
              notifMsg = `Your service for Token ${token.tokenNumber} is complete. You can rate your experience now!`;
              notifType = 'SUCCESS';
            } else if (action === 'NO_SHOW') {
              notifTitle = 'Token Marked No-Show';
              notifMsg = `Token ${token.tokenNumber} was marked as No-Show. Please rebook if needed.`;
              notifType = 'WARNING';
            } else if (action === 'SKIP') {
              notifTitle = 'Token Skipped';
              notifMsg = `Token ${token.tokenNumber} was skipped by counter staff.`;
              notifType = 'WARNING';
            }

            await Notification.create({
              userId: token.citizenId,
              officeId: token.officeId,
              tokenId: token._id,
              type: notifType,
              title: notifTitle,
              message: notifMsg,
              channel: 'IN_APP',
              isRead: false
            });
          } catch (notifErr) {
            console.error('Failed to create in-app notification:', notifErr);
          }

          // Socket.IO real-time broadcast
          try {
            const { getSocket } = await import('@/lib/socketClient');
            const socket = getSocket();
            const officeIdStr = token.officeId?.toString();
            const tokenIdStr = token._id.toString();

            socket.emit('queue:action', { 
              action, 
              officeId: officeIdStr, 
              tokenId: tokenIdStr, 
              tokenNumber: token.tokenNumber,
              status: token.status 
            });
            socket.emit('queue:updated', { 
              officeId: officeIdStr, 
              serviceId: token.serviceId?.toString() 
            });

            const eventPayload = {
              tokenId: tokenIdStr,
              tokenNumber: token.tokenNumber,
              officeId: officeIdStr,
              counterName: counter.name,
              counterNumber: counter.counterNumber,
              status: token.status
            };

            if (action === 'CALL_NEXT' || action === 'RECALL' || action === 'CALL' || action === 'CALL_SPECIFIC') {
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
          } catch {
            // socket broadcast optional
          }
        } catch (pushErr) {
          console.error('Failed to send push for action', action, pushErr);
        }
      }
    }

    return NextResponse.json({ success: true, data: token });

  } catch (error: any) {
    console.error('Staff Action API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
