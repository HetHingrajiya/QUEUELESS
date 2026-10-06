import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Token } from '@/models/Token';
import { Office } from '@/models/Office';
import { getUserFromCookie } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();
    if (!user || user.role === 'CITIZEN' || user.role === 'STAFF') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // RBAC
    if (user.role === 'ADMIN') {
      const { hasPermission } = await import('@/lib/permissions');
      const canViewAnalytics = await hasPermission(user.userId, 'VIEW_ANALYTICS');
      if (!canViewAnalytics) {
        return NextResponse.json({ success: false, message: 'Forbidden: Missing VIEW_ANALYTICS permission' }, { status: 403 });
      }
    }

    const orgId = user.role === 'SUPER_ADMIN' ? null : user.organizationId;
    if (user.role === 'ADMIN' && !orgId) {
      return NextResponse.json({ success: false, message: 'No organization' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const officeId = searchParams.get('officeId');
    const serviceId = searchParams.get('serviceId');

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Get all office IDs belonging to this organization
    const orgOfficeQuery: any = {};
    if (orgId) {
       orgOfficeQuery.organizationId = new mongoose.Types.ObjectId(orgId);
    }

    if (officeId && mongoose.Types.ObjectId.isValid(officeId)) {
      orgOfficeQuery._id = new mongoose.Types.ObjectId(officeId);
    }
    const orgOffices = await Office.find(orgOfficeQuery).select('_id').lean();
    const orgOfficeIds = orgOffices.map(o => o._id);

    if (orgOfficeIds.length === 0 && orgId) {
      return NextResponse.json({
        success: true,
        data: {
          summary: { total: 0, waiting: 0, serving: 0, completed: 0, cancelled: 0, skipped: 0, noShow: 0, avgWaitMin: 0, avgServiceMin: 0, noShowRate: '0.0', completionRate: '0.0' },
          dailyVolume: [],
        }
      });
    }

    const matchBase: any = {
      createdAt: { $gte: start, $lte: end },
    };
    
    if (orgId || officeId) {
      matchBase.officeId = { $in: orgOfficeIds };
    }

    if (serviceId && mongoose.Types.ObjectId.isValid(serviceId)) {
      matchBase.serviceId = new mongoose.Types.ObjectId(serviceId);
    }

    // Summary aggregation
    const summaryAgg = await Token.aggregate([
      { $match: matchBase },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          waiting: { $sum: { $cond: [{ $eq: ['$status', 'WAITING'] }, 1, 0] } },
          serving: { $sum: { $cond: [{ $eq: ['$status', 'SERVING'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] } },
          skipped: { $sum: { $cond: [{ $eq: ['$status', 'SKIPPED'] }, 1, 0] } },
          noShow: { $sum: { $cond: [{ $eq: ['$status', 'NO_SHOW'] }, 1, 0] } },
          avgWaitMs: {
            $avg: {
              $cond: [
                { $ifNull: ['$callTime', false] },
                { $subtract: ['$callTime', '$createdAt'] },
                null
              ]
            }
          },
          avgServiceMs: {
            $avg: {
              $cond: [
                { $and: [{ $ifNull: ['$completionTime', false] }, { $ifNull: ['$startTime', false] }] },
                { $subtract: ['$completionTime', '$startTime'] },
                null
              ]
            }
          }
        }
      }
    ]);

    const s = summaryAgg[0] || { total: 0, waiting: 0, serving: 0, completed: 0, cancelled: 0, skipped: 0, noShow: 0, avgWaitMs: 0, avgServiceMs: 0 };
    const avgWaitMin = s.avgWaitMs ? Math.round(s.avgWaitMs / 60000) : 0;
    const avgServiceMin = s.avgServiceMs ? Math.round(s.avgServiceMs / 60000) : 0;
    const noShowRate = s.total > 0 ? ((s.noShow / s.total) * 100).toFixed(1) : '0.0';
    const completionRate = s.total > 0 ? ((s.completed / s.total) * 100).toFixed(1) : '0.0';

    // Daily volume
    const dailyAgg = await Token.aggregate([
      { $match: matchBase },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } },
      { $project: { day: '$_id', count: 1, _id: 0 } }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total: s.total, waiting: s.waiting, serving: s.serving, completed: s.completed,
          cancelled: s.cancelled, skipped: s.skipped, noShow: s.noShow,
          avgWaitMin, avgServiceMin, noShowRate, completionRate,
        },
        dailyVolume: dailyAgg,
        filters: { startDate: start, endDate: end, officeId, serviceId }
      }
    });
  } catch (error: any) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
