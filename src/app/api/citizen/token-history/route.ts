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

    // Fetch all tokens for this citizen, sorted by newest first
    const tokens = await Token.find({ citizenId: user.userId })
      .populate('officeId', 'name address')
      .populate('serviceId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const history = tokens.map(t => ({
      _id: t._id,
      tokenNumber: t.tokenNumber,
      status: t.status,
      officeName: (t.officeId as any)?.name || 'Unknown Office',
      serviceName: (t.serviceId as any)?.name || 'Unknown Service',
      date: t.createdAt,
      completedAt: t.completedAt || null
    }));

    return NextResponse.json({
      success: true,
      data: history
    });

  } catch (error: any) {
    console.error('Citizen Token History API error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
