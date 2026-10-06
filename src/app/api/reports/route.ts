import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Report } from '@/models/Report';
import { Token } from '@/models/Token';
import { getUserFromCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';
import { requirePermission } from '@/lib/rbac';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const query: any = {};
    if (user.role === 'ADMIN') {
      query.organizationId = user.organizationId;
    }

    const reports = await Report.find(query)
      .populate('generatedBy', 'fullName email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: reports });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const user = await requirePermission('reports', 'add');
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const orgId = user.role === 'ADMIN' ? user.organizationId : (body.organizationId || null);

    // Calculate date range from reportType
    const now = new Date();
    let dateRangeStart: Date;
    let dateRangeEnd: Date = new Date(now);
    dateRangeEnd.setHours(23, 59, 59, 999);
    const reportType: string = body.reportType || 'CUSTOM';

    if (body.startDate && body.endDate) {
      dateRangeStart = new Date(body.startDate);
      dateRangeEnd = new Date(body.endDate);
      dateRangeEnd.setHours(23, 59, 59, 999);
    } else if (reportType === 'DAILY') {
      dateRangeStart = new Date(now);
      dateRangeStart.setHours(0, 0, 0, 0);
    } else if (reportType === 'WEEKLY') {
      dateRangeStart = new Date(now);
      dateRangeStart.setDate(now.getDate() - 6);
      dateRangeStart.setHours(0, 0, 0, 0);
    } else if (reportType === 'MONTHLY') {
      dateRangeStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else {
      dateRangeStart = new Date(now);
      dateRangeStart.setDate(now.getDate() - 6);
      dateRangeStart.setHours(0, 0, 0, 0);
    }

    // Build base match via Office IDs for org isolation
    const { Office } = await import('@/models/Office');
    const matchBase: any = {
      createdAt: { $gte: dateRangeStart, $lte: dateRangeEnd },
    };
    if (orgId && mongoose.Types.ObjectId.isValid(orgId)) {
      const orgOffices = await Office.find({ organizationId: new mongoose.Types.ObjectId(orgId) }).select('_id').lean();
      matchBase.officeId = { $in: orgOffices.map(o => o._id) };
    }

    // Aggregate summary
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
              $cond: [{ $ifNull: ['$callTime', false] }, { $subtract: ['$callTime', '$createdAt'] }, null]
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
    const summaryData = {
      total: s.total,
      completed: s.completed,
      waiting: s.waiting,
      serving: s.serving,
      cancelled: s.cancelled,
      skipped: s.skipped,
      noShow: s.noShow,
      avgWaitMin: s.avgWaitMs ? Math.round(s.avgWaitMs / 60000) : 0,
      avgServiceMin: s.avgServiceMs ? Math.round(s.avgServiceMs / 60000) : 0,
      noShowRate: s.total > 0 ? ((s.noShow / s.total) * 100).toFixed(1) : '0.0',
      completionRate: s.total > 0 ? ((s.completed / s.total) * 100).toFixed(1) : '0.0',
    };

    // Office breakdown
    const officeBreakdown = await Token.aggregate([
      { $match: matchBase },
      { $lookup: { from: 'offices', localField: 'officeId', foreignField: '_id', as: 'office', pipeline: [{ $project: { name: 1 } }] } },
      {
        $group: {
          _id: { $arrayElemAt: ['$office.name', 0] },
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
        }
      },
      { $project: { _id: 0, name: '$_id', total: 1, completed: 1 } }
    ]);

    // Service breakdown
    const serviceBreakdown = await Token.aggregate([
      { $match: matchBase },
      { $lookup: { from: 'services', localField: 'serviceId', foreignField: '_id', as: 'service', pipeline: [{ $project: { name: 1 } }] } },
      {
        $group: {
          _id: { $arrayElemAt: ['$service.name', 0] },
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
        }
      },
      { $project: { _id: 0, name: '$_id', total: 1, completed: 1 } }
    ]);

    // Daily breakdown
    const dailyBreakdown = await Token.aggregate([
      { $match: matchBase },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, day: '$_id', count: 1 } }
    ]);

    const reportName = body.name || `${reportType} Report – ${dateRangeStart.toISOString().split('T')[0]}`;

    const newReport = await Report.create({
      name: reportName,
      reportType: reportType.toUpperCase(),
      type: 'CSV',
      organizationId: orgId ? new mongoose.Types.ObjectId(orgId) : undefined,
      generatedBy: user.userId,
      dateRangeStart,
      dateRangeEnd,
      status: 'COMPLETED',
      summaryData,
      officeBreakdown,
      serviceBreakdown,
      dailyBreakdown,
    });

    await createAuditLog({
      action: 'CREATE',
      module: 'Reports',
      description: `Generated report: ${newReport.name}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'Report',
      entityId: newReport._id.toString(),
      newData: { reportType, dateRangeStart, dateRangeEnd, summary: summaryData },
      request,
    });

    return NextResponse.json({ success: true, message: 'Report generated successfully', data: newReport }, { status: 201 });
  } catch (error: any) {
    console.error('Report generate error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
