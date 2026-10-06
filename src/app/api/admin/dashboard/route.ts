import { NextResponse, NextRequest } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Token } from '@/models/Token';
import { Counter } from '@/models/Counter';
import { User, UserRole } from '@/models/User';
import { Office } from '@/models/Office';
import { QueueEvent } from '@/models/QueueEvent';
import { headers } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    // Extract organization ID and office ID from headers or user context
    const headersList = await headers();
    const user = await getUserFromCookie();
    const role = user?.role;
    
    if (role !== UserRole.ADMIN && role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const adminUser = await User.findById(user?.userId).lean();
    if (!adminUser) {
       return NextResponse.json({ success: false, message: 'Admin user not found' }, { status: 404 });
    }

    let officeQuery: any = {};

    if (role === UserRole.SUPER_ADMIN) {
      // SUPER_ADMIN sees all data across all offices
    } else if (adminUser.organizationId) {
      // ADMIN always sees all offices in their entire organization
      const offices = await Office.find({ organizationId: adminUser.organizationId }).lean();
      const officeIds = offices.map(o => o._id);
      
      if (officeIds.length > 0) {
        officeQuery = { officeId: { $in: officeIds } };
      } else {
        // No offices configured yet for this org
        return NextResponse.json({
          success: true,
          data: {
            totalTokens: 0, waitingTokens: 0, servingTokens: 0, completedTokens: 0, skippedTokens: 0, noShowTokens: 0,
            activeCounters: 0, totalCounters: 0, totalStaff: 0, counters: [], recentActivity: []
          }
        });
      }
    } else {
       return NextResponse.json({ success: false, message: 'Admin has no organization assigned' }, { status: 404 });
    }

    // Get today's start and end dates
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Get tokens for today
    const todaysTokens = await Token.find({
      ...officeQuery,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).populate('serviceId', 'name').lean();

    const waiting = todaysTokens.filter(t => t.status === 'WAITING').length;
    const serving = todaysTokens.filter(t => t.status === 'SERVING').length;
    const completed = todaysTokens.filter(t => t.status === 'COMPLETED').length;
    const skipped = todaysTokens.filter(t => t.status === 'SKIPPED').length;
    const noShow = todaysTokens.filter(t => t.status === 'NO_SHOW').length;

    // Get active counters
    const counters = await Counter.find(officeQuery).populate('serviceIds', 'name').lean();
    const activeCounters = counters.filter(c => c.status === 'ACTIVE' || c.status === 'SERVING').length;

    // Get staff
    const staff = await User.countDocuments({ ...officeQuery, role: UserRole.STAFF, status: 'ACTIVE' });

    // Recent Activity (Queue Events)
    const recentActivity = await QueueEvent.find(officeQuery)
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

// Force recompile 1
