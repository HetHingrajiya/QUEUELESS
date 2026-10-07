import { NextResponse, NextRequest } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Token, TokenStatus } from '@/models/Token';
import { Counter } from '@/models/Counter';
import { User, UserRole } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const user = await getUserFromCookie();
    if (!user || user.role !== UserRole.STAFF) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const staffUser = await User.findById(user.userId).lean();
    if (!staffUser || !staffUser.officeId) {
       return NextResponse.json({ success: false, message: 'Staff user or office not found' }, { status: 404 });
    }

    // Get the counter assigned to this staff member
    const counter = await Counter.findOne({ staffId: staffUser._id }).lean();
    if (!counter) {
      return NextResponse.json({ success: false, message: 'No counter assigned to this staff member' }, { status: 404 });
    }
    
    const serviceIdsArray = counter.serviceIds || [];

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Get waiting tokens (only for services this counter handles)
    const tokens = await Token.find({
      officeId: counter.officeId,
      serviceId: { $in: serviceIdsArray.map((s: any) => s._id) },
      status: { $in: [TokenStatus.WAITING, TokenStatus.CHECKED_IN] },
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    })
    .sort({ createdAt: 1 })
    .populate('serviceId', 'name')
    .populate('citizenId', 'fullName')
    .lean();

    const formattedTokens = tokens.map(t => ({
      _id: t._id,
      tokenNumber: t.tokenNumber,
      citizenName: (t.citizenId as any)?.fullName || 'Walk-in',
      serviceName: (t.serviceId as any)?.name,
      status: t.status,
      createdAt: t.createdAt
    }));

    return NextResponse.json({
      success: true,
      data: formattedTokens
    });

  } catch (error: any) {
    console.error('Staff Queue API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
