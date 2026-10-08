import { NextResponse, NextRequest } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Token, TokenStatus } from '@/models/Token';
import { Counter } from '@/models/Counter';
import { User, UserRole } from '@/models/User';
import { headers } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const headersList = await headers();
    const user = await getUserFromCookie();
    const role = user?.role;
    const email = headersList.get('x-user-email');
    
    if (role !== UserRole.STAFF) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const staffUser = await User.findById(user?.userId).lean();
    if (!staffUser || !staffUser.officeId) {
       return NextResponse.json({ success: false, message: 'Staff user or office not found' }, { status: 404 });
    }

    const staffId = staffUser._id;
    const officeId = staffUser.officeId;

    // Get the counter assigned to this staff member (ignore officeId strict check, if they are assigned, they are assigned)
    const counter = await Counter.findOne({ staffId }).populate('serviceIds', 'name').lean();
    if (!counter) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const waitingTokens = await Token.find({
        officeId,
        status: { $in: [TokenStatus.WAITING, TokenStatus.CHECKED_IN] },
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      })
      .sort({ createdAt: 1 })
      .populate('serviceId', 'name')
      .limit(10)
      .lean();

      const totalWaitingCount = await Token.countDocuments({
        officeId,
        status: { $in: [TokenStatus.WAITING, TokenStatus.CHECKED_IN] },
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      const completedCount = await Token.countDocuments({
        officeId,
        status: TokenStatus.COMPLETED,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      return NextResponse.json({
        success: true,
        data: {
          counter: null,
          currentToken: null,
          nextTokens: waitingTokens.map(t => ({
            _id: t._id,
            tokenNumber: t.tokenNumber,
            serviceName: (t.serviceId as any)?.name,
            waitTime: Math.floor((Date.now() - new Date(t.createdAt).getTime()) / 60000)
          })),
          stats: {
            waitingCount: totalWaitingCount,
            completedToday: completedCount,
            avgServiceTime: "0.0"
          }
        }
      });
    }
    
    // Normalize serviceIds
    const serviceIdsArray = counter.serviceIds || [];

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Get current token (CALLED or SERVING at this counter)
    const currentToken = await Token.findOne({
      counterId: counter._id,
      status: { $in: [TokenStatus.CALLED, TokenStatus.SERVING] },
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).populate('citizenId', 'fullName').populate('serviceId', 'name').lean();

    // Get waiting tokens (only for services this counter handles)
    const waitingTokens = await Token.find({
      officeId: counter.officeId, // Use counter's officeId
      serviceId: { $in: serviceIdsArray.map((s: any) => s._id) },
      status: { $in: [TokenStatus.WAITING, TokenStatus.CHECKED_IN] },
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    })
    .sort({ createdAt: 1 })
    .populate('serviceId', 'name')
    .limit(10)
    .lean();

    // Get today's completed tokens for this counter
    const completedTokens = await Token.find({
      counterId: counter._id,
      status: TokenStatus.COMPLETED,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).lean();

    let totalServiceTime = 0;
    completedTokens.forEach(t => {
      if (t.processingTime) totalServiceTime += t.processingTime;
    });
    
    const avgServiceTimeMins = completedTokens.length > 0 ? (totalServiceTime / completedTokens.length) / 60 : 0;

    // Count all waiting for counter services
    const totalWaitingCount = await Token.countDocuments({
      officeId: counter.officeId,
      serviceId: { $in: serviceIdsArray.map((s: any) => s._id) },
      status: { $in: [TokenStatus.WAITING, TokenStatus.CHECKED_IN] },
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    return NextResponse.json({
      success: true,
      data: {
        counter: {
          _id: counter._id,
          name: counter.name,
          number: counter.number,
          status: counter.status,
          serviceNames: serviceIdsArray.map((s: any) => s.name).join(', ')
        },
        currentToken: currentToken ? {
          _id: currentToken._id,
          tokenNumber: currentToken.tokenNumber,
          citizenName: (currentToken.citizenId as any)?.fullName || 'Walk-in',
          serviceName: (currentToken.serviceId as any)?.name,
          status: currentToken.status,
          startTime: currentToken.startTime,
          callTime: currentToken.callTime,
        } : null,
        nextTokens: waitingTokens.map(t => ({
          _id: t._id,
          tokenNumber: t.tokenNumber,
          serviceName: (t.serviceId as any)?.name,
          waitTime: Math.floor((Date.now() - new Date(t.createdAt).getTime()) / 60000)
        })),
        stats: {
          waitingCount: totalWaitingCount,
          completedToday: completedTokens.length,
          avgServiceTime: avgServiceTimeMins.toFixed(1)
        }
      }
    });

  } catch (error: any) {
    console.error('Staff Dashboard API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
