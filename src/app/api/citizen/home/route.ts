import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Office } from '@/models/Office';
import { Token } from '@/models/Token';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    // 1. Fetch active token for the citizen
    const activeTokenDoc = await Token.findOne({
      citizenId: user.userId,
      status: { $in: ['WAITING', 'CALLED', 'CHECKED_IN', 'SERVING'] }
    }).populate('officeId', 'name').populate('serviceId', 'name').sort({ createdAt: -1 });

    let activeToken = null;
    if (activeTokenDoc) {
      activeToken = {
        id: activeTokenDoc._id,
        tokenNumber: activeTokenDoc.tokenNumber,
        status: activeTokenDoc.status,
        serviceName: (activeTokenDoc.serviceId as any)?.name || 'Unknown Service',
        officeName: (activeTokenDoc.officeId as any)?.name || 'Unknown Office'
      };
    }

    // 2. Fetch offices
    // For MVP, just return all active offices
    const officesDocs = await Office.find({ status: 'ACTIVE' }).limit(5).lean();
    
    const offices = officesDocs.map(o => ({
      _id: o._id,
      name: o.name,
      address: o.address,
      status: o.status,
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      latitude: o.latitude,
      longitude: o.longitude
    }));

    return NextResponse.json({
      success: true,
      data: {
        activeToken,
        offices
      }
    });

  } catch (error: any) {
    console.error('Citizen Home API error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
