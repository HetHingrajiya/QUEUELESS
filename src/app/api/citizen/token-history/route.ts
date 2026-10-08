import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Token } from '@/models/Token';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');

    const filter: any = { citizenId: user.userId };
    if (statusParam && statusParam !== 'ALL') {
      filter.status = statusParam.toUpperCase();
    }

    // Fetch all tokens for this citizen, sorted by newest first
    const tokens = await Token.find(filter)
      .populate('officeId', 'name address department')
      .populate('serviceId', 'name estimatedServiceTime fee')
      .populate('counterId', 'name counterNumber')
      .sort({ createdAt: -1 })
      .lean();

    const history = tokens.map(t => {
      // Calculate wait duration if called/completed
      let waitMinutes = 0;
      if (t.callTime && t.createdAt) {
        waitMinutes = Math.max(1, Math.round((new Date(t.callTime).getTime() - new Date(t.createdAt).getTime()) / 60000));
      } else if (t.estimatedWaitTime) {
        waitMinutes = t.estimatedWaitTime;
      }

      let serviceDuration = 0;
      if (t.completedAt && t.startTime) {
        serviceDuration = Math.max(1, Math.round((new Date(t.completedAt).getTime() - new Date(t.startTime).getTime()) / 60000));
      }

      return {
        _id: t._id,
        tokenNumber: t.tokenNumber,
        status: t.status,
        officeName: (t.officeId as any)?.name || 'Government Office',
        officeAddress: (t.officeId as any)?.address || '',
        officeDepartment: (t.officeId as any)?.department || '',
        serviceName: (t.serviceId as any)?.name || 'Service',
        counterName: (t.counterId as any)?.name || (t.counterId as any)?.counterNumber ? `Counter ${(t.counterId as any).counterNumber}` : null,
        date: t.createdAt,
        callTime: t.callTime || null,
        startTime: t.startTime || null,
        completedAt: t.completedAt || null,
        waitMinutes,
        serviceDuration,
        notes: t.notes || null
      };
    });

    return NextResponse.json({
      success: true,
      data: history
    });

  } catch (error: any) {
    console.error('Citizen Token History API error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
