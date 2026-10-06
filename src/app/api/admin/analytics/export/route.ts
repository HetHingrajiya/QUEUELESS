import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Token } from '@/models/Token';
import { getUserFromCookie } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const orgId = user.organizationId;
    if (!orgId) {
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

    // Resolve office IDs for this org
    const orgOfficeQuery: any = { organizationId: new mongoose.Types.ObjectId(orgId) };
    if (officeId && mongoose.Types.ObjectId.isValid(officeId)) {
      orgOfficeQuery._id = new mongoose.Types.ObjectId(officeId);
    }
    const { Office } = await import('@/models/Office');
    const orgOffices = await Office.find(orgOfficeQuery).select('_id').lean();
    const orgOfficeIds = orgOffices.map(o => o._id);

    const matchBase: any = {
      officeId: { $in: orgOfficeIds },
      createdAt: { $gte: start, $lte: end },
    };
    if (serviceId && mongoose.Types.ObjectId.isValid(serviceId)) {
      matchBase.serviceId = new mongoose.Types.ObjectId(serviceId);
    }

    // Aggregation by date+office+service
    const rows = await Token.aggregate([
      { $match: matchBase },
      {
        $lookup: {
          from: 'offices', localField: 'officeId', foreignField: '_id',
          as: 'office', pipeline: [{ $project: { name: 1 } }]
        }
      },
      {
        $lookup: {
          from: 'services', localField: 'serviceId', foreignField: '_id',
          as: 'service', pipeline: [{ $project: { name: 1 } }]
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            office: { $arrayElemAt: ['$office.name', 0] },
            service: { $arrayElemAt: ['$service.name', 0] },
          },
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
          waiting: { $sum: { $cond: [{ $eq: ['$status', 'WAITING'] }, 1, 0] } },
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
      },
      { $sort: { '_id.date': 1, '_id.office': 1 } }
    ]);

    // Build CSV
    const headers = ['Date', 'Office', 'Service', 'Total Tokens', 'Completed', 'Waiting', 'Skipped', 'No Show', 'Avg Wait Time (min)', 'Avg Service Time (min)'];
    const csvLines = [
      headers.join(','),
      ...rows.map(r => [
        r._id.date || '',
        `"${r._id.office || 'N/A'}"`,
        `"${r._id.service || 'N/A'}"`,
        r.total,
        r.completed,
        r.waiting,
        r.skipped,
        r.noShow,
        r.avgWaitMs ? Math.round(r.avgWaitMs / 60000) : 0,
        r.avgServiceMs ? Math.round(r.avgServiceMs / 60000) : 0,
      ].join(','))
    ];

    const csv = csvLines.join('\n');
    const filename = `queueless-analytics-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    });
  } catch (error: any) {
    console.error('Analytics export error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
