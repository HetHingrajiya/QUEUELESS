import { NextResponse, NextRequest } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Token, TokenStatus } from '@/models/Token';
import { Counter, CounterStatus } from '@/models/Counter';
import { User, UserRole } from '@/models/User';
import { QueueEvent } from '@/models/QueueEvent';
import { SystemSettings } from '@/models/SystemSettings';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const headersList = await headers();
    const user = await getUserFromCookie();
    const role = user?.role;
    const email = headersList.get('x-user-email');
    
    if (role !== UserRole.STAFF) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { action, tokenId } = await req.json();

    const staffUser = await User.findById(user?.userId).lean();
    if (!staffUser || !staffUser.officeId) {
       return NextResponse.json({ success: false, message: 'Staff user or office not found' }, { status: 404 });
    }

    const counter = await Counter.findOne({ staffId: staffUser._id }).lean();
    if (!counter) {
      return NextResponse.json({ success: false, message: 'No counter assigned' }, { status: 404 });
    }

    const officeId = staffUser.officeId;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let token = null;

    if (action === 'CALL_NEXT') {
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
        { $set: { status: TokenStatus.NO_SHOW } }
      );

      // Find the next waiting token
      token = await Token.findOneAndUpdate(
        {
          officeId,
          serviceId: { $in: counter.serviceIds },
          status: { $in: [TokenStatus.WAITING, TokenStatus.CHECKED_IN] },
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        },
        {
          $set: {
            status: TokenStatus.CALLED,
            counterId: counter._id,
            staffId: staffUser._id,
            callTime: new Date()
          }
        },
        { sort: { createdAt: 1 }, new: true }
      );

      if (!token) {
        return NextResponse.json({ success: false, message: 'No tokens in queue' }, { status: 404 });
      }

      await Counter.findByIdAndUpdate(counter._id, { status: CounterStatus.SERVING });

    } else if (tokenId) {
      token = await Token.findById(tokenId);
      if (!token) return NextResponse.json({ success: false, message: 'Token not found' }, { status: 404 });

      const now = new Date();

      switch (action) {
        case 'START_SERVICE':
          token.status = TokenStatus.SERVING;
          token.startTime = now;
          break;
        case 'COMPLETE':
          token.status = TokenStatus.COMPLETED;
          token.completionTime = now;
          if (token.startTime) {
            token.processingTime = Math.floor((now.getTime() - new Date(token.startTime).getTime()) / 1000);
          }
          await Counter.findByIdAndUpdate(counter._id, { status: CounterStatus.ACTIVE });
          break;
        case 'SKIP':
          token.status = TokenStatus.SKIPPED;
          await Counter.findByIdAndUpdate(counter._id, { status: CounterStatus.ACTIVE });
          break;
        case 'NO_SHOW':
          token.status = TokenStatus.NO_SHOW;
          await Counter.findByIdAndUpdate(counter._id, { status: CounterStatus.ACTIVE });
          break;
        case 'RECALL':
          token.status = TokenStatus.CALLED;
          token.callTime = now;
          break;
        default:
          return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
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
        eventType: `token:${action.toLowerCase()}`,
        counterId: counter._id,
        staffId: staffUser._id,
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
    }

    return NextResponse.json({ success: true, data: token });

  } catch (error: any) {
    console.error('Staff Action API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
