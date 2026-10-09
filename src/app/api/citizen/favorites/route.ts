import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Favorite } from '@/models/Favorite';
import { Office } from '@/models/Office';
import { getUserFromCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';
import { QueueMetricsService } from '@/lib/queue';

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
    const officeId = searchParams.get('officeId');

    if (officeId) {
      if (!mongoose.Types.ObjectId.isValid(officeId)) {
        return NextResponse.json({ success: false, message: 'Invalid Office ID' }, { status: 400 });
      }
      const existing = await Favorite.findOne({ userId: user.userId, officeId });
      return NextResponse.json({
        success: true,
        data: {
          isFavorite: !!existing,
          favoriteId: existing?._id || null,
          officeId
        }
      });
    }

    interface PopulatedFavoriteDoc {
      _id: mongoose.Types.ObjectId;
      userId: mongoose.Types.ObjectId;
      officeId: {
        _id: mongoose.Types.ObjectId;
        name: string;
        address?: string;
        city?: string;
        state?: string;
        latitude?: number;
        longitude?: number;
        status?: string;
      };
      createdAt: Date;
    }

    const favorites = await Favorite.find({ userId: user.userId })
      .populate({
        path: 'officeId',
        select: 'name address city state pincode latitude longitude status workingHours'
      })
      .sort({ createdAt: -1 })
      .lean() as unknown as PopulatedFavoriteDoc[];

    const formatted = await Promise.all(
      favorites
        .filter((f) => Boolean(f.officeId))
        .map(async (f) => {
          const metrics = await QueueMetricsService.getOfficeMetrics(f.officeId._id);
          return {
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
            waitingCount: metrics.waitingCount,
            estimatedWaitMinutes: metrics.estimatedWaitMinutes,
            queueLoad: metrics.queueLoad.level,
            createdAt: f.createdAt
          };
        })
    );

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Citizen Favorites GET error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || !user.userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { officeId } = body;

    if (!officeId || !mongoose.Types.ObjectId.isValid(officeId)) {
      return NextResponse.json({ success: false, message: 'Valid Office ID is required' }, { status: 400 });
    }

    const office = await Office.findOne({ _id: officeId, status: 'ACTIVE' });
    if (!office) {
      return NextResponse.json({ success: false, message: 'Office not found or inactive' }, { status: 404 });
    }

    const fav = await Favorite.findOneAndUpdate(
      { userId: user.userId, officeId },
      { $setOnInsert: { userId: user.userId, officeId } },
      { upsert: true, returnDocument: 'after' }
    );

    await createAuditLog({
      action: 'ADD_FAVORITE',
      module: 'CITIZEN',
      description: `Citizen saved office ${office.name} to favorites`,
      entityType: 'Office',
      entityId: officeId,
      userId: user.userId,
      userRole: user.role,
      officeId,
      request: req
    });

    return NextResponse.json({ success: true, message: 'Office added to favorites', data: fav });
  } catch (error) {
    console.error('Citizen Favorites POST error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
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
    const officeId = searchParams.get('officeId');
    const favoriteId = searchParams.get('favoriteId');

    if (!officeId && !favoriteId) {
      return NextResponse.json({ success: false, message: 'officeId or favoriteId is required' }, { status: 400 });
    }

    const filter: Record<string, unknown> = { userId: user.userId };
    let targetOfficeId = officeId;

    if (officeId) {
      if (!mongoose.Types.ObjectId.isValid(officeId)) {
        return NextResponse.json({ success: false, message: 'Valid Office ID is required' }, { status: 400 });
      }
      filter.officeId = officeId;
    } else if (favoriteId) {
      if (!mongoose.Types.ObjectId.isValid(favoriteId)) {
        return NextResponse.json({ success: false, message: 'Valid Favorite ID is required' }, { status: 400 });
      }
      filter._id = favoriteId;
      const existing = await Favorite.findOne(filter);
      targetOfficeId = existing?.officeId?.toString() || null;
    }

    await Favorite.deleteOne(filter);

    await createAuditLog({
      action: 'REMOVE_FAVORITE',
      module: 'CITIZEN',
      description: `Citizen removed office from favorites`,
      entityId: targetOfficeId || 'unknown',
      userId: user.userId,
      userRole: user.role,
      officeId: targetOfficeId || undefined,
      request: req
    });

    return NextResponse.json({ success: true, message: 'Office removed from favorites' });
  } catch (error) {
    console.error('Citizen Favorites DELETE error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
