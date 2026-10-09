import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Token } from '@/models/Token';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || !user.userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');

    interface PopulatedHistoryTokenDoc {
      _id: mongoose.Types.ObjectId;
      tokenNumber: string;
      status: string;
      officeId?: { name?: string; address?: string; department?: string };
      serviceId?: { name?: string; estimatedServiceTime?: number; fee?: number };
      counterId?: { name?: string; counterNumber?: number };
      createdAt: Date;
      callTime?: Date;
      startTime?: Date;
      completedAt?: Date;
      completionTime?: Date;
      processingTime?: number;
      estimatedWaitTime?: number;
      notes?: string;
    }

    const filter: Record<string, unknown> = { citizenId: user.userId };
    if (statusParam && statusParam !== 'ALL') {
      filter.status = statusParam.toUpperCase();
    }

    // Fetch all tokens for this citizen, sorted by newest first
    const tokens = await Token.find(filter)
      .populate('officeId', 'name address department')
      .populate('serviceId', 'name estimatedServiceTime fee')
      .populate('counterId', 'name counterNumber')
      .sort({ createdAt: -1 })
      .lean() as unknown as PopulatedHistoryTokenDoc[];

    const history = tokens.map((t) => {
      // Calculate wait duration if called/completed
      let waitMinutes = 0;
      if (t.callTime && t.createdAt) {
        waitMinutes = Math.max(1, Math.round((new Date(t.callTime).getTime() - new Date(t.createdAt).getTime()) / 60000));
      } else if (t.estimatedWaitTime) {
        waitMinutes = t.estimatedWaitTime;
      }

      let serviceDuration = 0;
      if (typeof t.processingTime === 'number' && t.processingTime > 0) {
        serviceDuration = Math.round(t.processingTime / 60);
      } else {
        const completion = t.completionTime || t.completedAt;
        const start = t.startTime || t.callTime;
        if (completion && start) {
          serviceDuration = Math.max(1, Math.round((new Date(completion).getTime() - new Date(start).getTime()) / 60000));
        }
      }

      return {
        _id: t._id,
        tokenNumber: t.tokenNumber,
        status: t.status,
        officeName: t.officeId?.name || 'Government Office',
        officeAddress: t.officeId?.address || '',
        officeDepartment: t.officeId?.department || '',
        serviceName: t.serviceId?.name || 'Service',
        counterName: t.counterId?.name || (t.counterId?.counterNumber ? `Counter ${t.counterId.counterNumber}` : null),
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

  } catch (error) {
    console.error('Citizen Token History API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
