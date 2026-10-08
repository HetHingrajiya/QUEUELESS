import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Office } from '@/models/Office';
import { Service } from '@/models/Service';
import { Token, TokenStatus } from '@/models/Token';
import { getUserFromCookie } from '@/lib/auth';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';
    const userLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
    const userLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;

    if (!query) {
      return NextResponse.json({
        success: true,
        data: {
          offices: [],
          services: []
        }
      });
    }

    const regex = new RegExp(query, 'i');

    // 1. Search Offices
    const offices = await Office.find({
      isActive: true,
      $or: [
        { name: regex },
        { address: regex },
        { department: regex },
        { district: regex }
      ]
    }).limit(20).lean();

    // 2. Search Services
    const services = await Service.find({
      isActive: true,
      $or: [
        { name: regex },
        { description: regex },
        { category: regex }
      ]
    }).populate('officeId', 'name address department latitude longitude').limit(20).lean();

    // Today's date range for queue counts
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Enrich offices with waiting token count and distance
    const enrichedOffices = await Promise.all(
      offices.map(async (off: any) => {
        const waitingCount = await Token.countDocuments({
          officeId: off._id,
          status: { $in: [TokenStatus.WAITING, TokenStatus.CHECKED_IN] },
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        let distanceKm: number | null = null;
        if (userLat !== null && userLng !== null && off.latitude && off.longitude) {
          distanceKm = calculateDistance(userLat, userLng, off.latitude, off.longitude);
        }

        return {
          _id: off._id,
          name: off.name,
          address: off.address,
          department: off.department || 'General Administration',
          operatingHours: off.operatingHours || off.workingHours || '09:00 AM - 05:00 PM',
          status: off.isActive ? 'OPEN' : 'CLOSED',
          waitingCount,
          estimatedWaitMinutes: waitingCount * 10,
          distanceKm
        };
      })
    );

    // Enrich services with waiting count
    const enrichedServices = await Promise.all(
      services.map(async (svc: any) => {
        const waitingCount = await Token.countDocuments({
          serviceId: svc._id,
          status: { $in: [TokenStatus.WAITING, TokenStatus.CHECKED_IN] },
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        return {
          _id: svc._id,
          name: svc.name,
          description: svc.description,
          category: svc.category || 'General',
          estimatedServiceTime: svc.estimatedServiceTime || 15,
          fee: svc.fee || 0,
          office: svc.officeId ? {
            _id: (svc.officeId as any)._id,
            name: (svc.officeId as any).name,
            address: (svc.officeId as any).address
          } : null,
          waitingCount,
          estimatedWaitMinutes: waitingCount * (svc.estimatedServiceTime || 10)
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        offices: enrichedOffices,
        services: enrichedServices
      }
    });

  } catch (error: any) {
    console.error('Citizen Search API error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
