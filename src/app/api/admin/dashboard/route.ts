import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import { Token } from '@/models/Token';
import { Counter } from '@/models/Counter';
import { User, UserRole } from '@/models/User';
import { QueueEvent } from '@/models/QueueEvent';
import { headers } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    // Extract organization ID and office ID from headers or user context
    const headersList = await headers();
    const role = headersList.get('x-user-role');
    const email = headersList.get('x-user-email');
    
    if (role !== UserRole.ADMIN && role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const adminUser = await User.findOne({ email }).lean();
    if (!adminUser || !adminUser.officeId) {
       return NextResponse.json({ success: false, message: 'Admin office not found' }, { status: 404 });
    }

    const officeId = adminUser.officeId;

    // Get today's start and end dates
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Get tokens for today
    const todaysTokens = await Token.find({
      officeId,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).populate('serviceId', 'name').lean();

    const waiting = todaysTokens.filter(t => t.status === 'WAITING').length;
    const serving = todaysTokens.filter(t => t.status === 'SERVING').length;
    const completed = todaysTokens.filter(t => t.status === 'COMPLETED').length;
    const skipped = todaysTokens.filter(t => t.status === 'SKIPPED').length;
    const noShow = todaysTokens.filter(t => t.status === 'NO_SHOW').length;

    // Get active counters
    const counters = await Counter.find({ officeId }).populate('serviceIds', 'name').lean();
    const activeCounters = counters.filter(c => c.status === 'ACTIVE' || c.status === 'SERVING').length;

    // Get staff
    const staff = await User.countDocuments({ officeId, role: UserRole.STAFF, status: 'ACTIVE' });

    // Recent Activity (Queue Events)
    const recentActivity = await QueueEvent.find({ officeId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('tokenId', 'tokenNumber status')
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        totalTokens: todaysTokens.length,
        waitingTokens: waiting,
        servingTokens: serving,
        completedTokens: completed,
        skippedTokens: skipped,
        noShowTokens: noShow,
        activeCounters,
        totalCounters: counters.length,
        totalStaff: staff,
        counters: counters.map(c => ({
          name: c.name,
          isOnline: c.status !== 'OFFLINE',
          serviceIds: c.serviceIds,
        })),
        recentActivity: recentActivity.map((a: any) => ({
          tokenNumber: a.tokenId?.tokenNumber || 'Unknown',
          status: a.eventType,
          updatedAt: a.createdAt
        }))
      }
    });

  } catch (error: any) {
    console.error('Admin Dashboard API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
