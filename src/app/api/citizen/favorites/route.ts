import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Favorite } from '@/models/Favorite';
import { Office } from '@/models/Office';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const favorites = await Favorite.find({ userId: user.userId })
      .populate({
        path: 'officeId',
        select: 'name address city state pincode latitude longitude status workingHours'
      })
      .sort({ createdAt: -1 })
      .lean();

    const formatted = favorites
      .filter((f: any) => f.officeId)
      .map((f: any) => ({
        _id: f.officeId._id,
        favoriteId: f._id,
        name: f.officeId.name,
        address: f.officeId.address,
        city: f.officeId.city,
        state: f.officeId.state,
        latitude: f.officeId.latitude,
        longitude: f.officeId.longitude,
        status: f.officeId.status || 'ACTIVE',
        statusColor: f.officeId.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-700',
        createdAt: f.createdAt
      }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Citizen Favorites GET error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { officeId } = body;

    if (!officeId) {
      return NextResponse.json({ success: false, message: 'Office ID is required' }, { status: 400 });
    }

    const office = await Office.findById(officeId);
    if (!office) {
      return NextResponse.json({ success: false, message: 'Office not found' }, { status: 404 });
    }

    const fav = await Favorite.findOneAndUpdate(
      { userId: user.userId, officeId },
      { $setOnInsert: { userId: user.userId, officeId } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, message: 'Office added to favorites', data: fav });
  } catch (error: any) {
    console.error('Citizen Favorites POST error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const officeId = searchParams.get('officeId');

    if (!officeId) {
      return NextResponse.json({ success: false, message: 'Office ID is required' }, { status: 400 });
    }

    await Favorite.deleteOne({ userId: user.userId, officeId });

    return NextResponse.json({ success: true, message: 'Office removed from favorites' });
  } catch (error: any) {
    console.error('Citizen Favorites DELETE error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
