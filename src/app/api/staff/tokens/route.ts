import { NextResponse, NextRequest } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Token } from '@/models/Token';
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

    const counter = await Counter.findOne({ staffId: staffUser._id }).lean();
    if (!counter) {
      return NextResponse.json({ success: false, message: 'No counter assigned to this staff member' }, { status: 404 });
    }
    
    const serviceIdsArray = counter.serviceIds || [];

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const serviceId = searchParams.get('serviceId') || '';
    const date = searchParams.get('date') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const query: any = {
      officeId: counter.officeId,
      serviceId: { $in: serviceIdsArray.map((s: any) => s._id) },
    };

    if (status) {
      query.status = status;
    }
    if (serviceId) {
      query.serviceId = serviceId;
    }
    if (search) {
      query.tokenNumber = { $regex: search, $options: 'i' };
    }
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    const skip = (page - 1) * limit;

    const [tokens, total] = await Promise.all([
      Token.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('serviceId', 'name')
        .populate('citizenId', 'fullName')
        .populate('counterId', 'name')
        .lean(),
      Token.countDocuments(query)
    ]);

    const formattedTokens = tokens.map(t => ({
      _id: t._id,
      tokenNumber: t.tokenNumber,
      citizenName: (t.citizenId as any)?.fullName || 'Walk-in',
      serviceName: (t.serviceId as any)?.name,
      status: t.status,
      createdAt: t.createdAt,
      callTime: t.callTime,
      startTime: t.startTime,
      endTime: t.endTime,
      processingTime: t.processingTime,
      counterName: (t.counterId as any)?.name,
      priority: t.priority || 'NORMAL',
    }));

    return NextResponse.json({
      success: true,
      data: formattedTokens,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('Staff Tokens API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
