import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Token, TokenStatus } from '@/models/Token';
import { Counter } from '@/models/Counter';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const activeTokens = await Token.find({
      citizenId: user.userId,
      status: { $in: [TokenStatus.WAITING, TokenStatus.CHECKED_IN, TokenStatus.CALLED, TokenStatus.SERVING] }
    })
    .populate('officeId', 'name address latitude longitude')
    .populate('serviceId', 'name averageServiceTime')
    .populate('counterId', 'name number')
    .sort({ createdAt: -1 })
    .lean();

    const results = await Promise.all(
      activeTokens.map(async (tok: any) => {
        const officeId = tok.officeId?._id;
        const serviceId = tok.serviceId?._id;

        // Current now serving
        const servingToken = await Token.findOne({
          officeId,
          serviceId,
          status: { $in: [TokenStatus.SERVING, TokenStatus.CALLED] },
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        }).sort({ callTime: -1 }).lean();

        // People ahead
        let peopleAhead = 0;
        if (tok.status === TokenStatus.WAITING || tok.status === TokenStatus.CHECKED_IN) {
          peopleAhead = await Token.countDocuments({
            officeId,
            serviceId,
            status: { $in: [TokenStatus.WAITING, TokenStatus.CHECKED_IN] },
            createdAt: { $gte: startOfDay, $lt: tok.createdAt }
          });
        }

        const avgTime = tok.serviceId?.averageServiceTime || 10;
        const estimatedWaitMin = Math.max(0, peopleAhead * avgTime);

        return {
          id: tok._id,
          tokenNumber: tok.tokenNumber,
          serviceName: tok.serviceId?.name || 'Public Service',
          officeName: tok.officeId?.name || 'Government Office',
          officeAddress: tok.officeId?.address,
          status: tok.status,
          peopleAhead,
          estimatedWaitMin,
          nowServing: servingToken?.tokenNumber || 'None',
          counterNumber: tok.counterId ? tok.counterId.name : (servingToken?.counterId ? 'Assigned' : 'Unassigned'),
          date: new Date(tok.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          checkInTime: tok.checkInTime,
          callTime: tok.callTime
        };
      })
    );

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    console.error('Citizen My Queue GET error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
