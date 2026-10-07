import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Office } from '@/models/Office';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    let query: any = { status: 'ACTIVE' };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    const offices = await Office.find(query)
      .select('name address contactEmail contactPhone status latitude longitude')
      .lean();

    // Map to add actual latitude and longitude
    const mappedOffices = offices.map(o => ({
      _id: o._id,
      name: o.name,
      address: o.address,
      phone: o.contactPhone,
      status: o.status,
      latitude: o.latitude,
      longitude: o.longitude,
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }));

    return NextResponse.json({
      success: true,
      data: mappedOffices
    });

  } catch (error: any) {
    console.error('Citizen Offices API error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
