import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Office } from '@/models/Office';
import { Service } from '@/models/Service';
import { getUserFromCookie } from '@/lib/auth';
import { QueueMetricsService } from '@/lib/queue';
import { calculateDistanceKm, formatDistance } from '@/lib/geo/distance';

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
    const query = searchParams.get('q')?.trim() || '';
    const rawLat = searchParams.get('lat');
    const rawLng = searchParams.get('lng');
    const userLat = rawLat !== null && rawLat !== '' ? parseFloat(rawLat) : null;
    const userLng = rawLng !== null && rawLng !== '' ? parseFloat(rawLng) : null;
    const hasValidCoords = userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng);

    if (!query) {
      return NextResponse.json({
        success: true,
        data: {
          offices: [],
          services: []
        }
      });
    }

    const sanitized = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(sanitized, 'i');

    // Find services matching query keywords/name/category to cross-link office IDs
    const matchingServiceOfficeIds = await Service.find({
      $and: [
        { $or: [{ status: 'ACTIVE' }, { isActive: true }, { status: { $exists: false } }] },
        {
          $or: [
            { name: regex },
            { code: regex },
            { description: regex },
            { category: regex }
          ]
        }
      ]
    }).distinct('officeId');

    interface SearchOfficeDoc {
      _id: mongoose.Types.ObjectId;
      name: string;
      code?: string;
      address?: string;
      department?: string;
      city?: string;
      operatingHours?: string;
      workingHours?: unknown;
      status?: string;
      isActive?: boolean;
      latitude?: number;
      longitude?: number;
    }

    interface SearchServiceDoc {
      _id: mongoose.Types.ObjectId;
      name: string;
      code?: string;
      description?: string;
      category?: string;
      slaMinutes?: number;
      expectedDuration?: number;
      estimatedServiceTime?: number;
      averageServiceTime?: number;
      fee?: number;
      status?: string;
      isActive?: boolean;
      officeId?: {
        _id?: mongoose.Types.ObjectId;
        name?: string;
        latitude?: number;
        longitude?: number;
        address?: string;
        city?: string;
        department?: string;
      };
    }

    // 1. Search Offices (support office name, department, keywords, address, city, district)
    const offices = await Office.find({
      $and: [
        { $or: [{ status: 'ACTIVE' }, { isActive: true }, { status: { $exists: false } }] },
        {
          $or: [
            { name: regex },
            { code: regex },
            { department: regex },
            { address: regex },
            { city: regex },
            { state: regex },
            { pincode: regex },
            { district: regex },
            { _id: { $in: matchingServiceOfficeIds } }
          ]
        }
      ]
    }).limit(30).lean() as unknown as SearchOfficeDoc[];

    const matchingOfficeIds = offices.map((o) => o._id);

    // 2. Search Services (support service name, category, description, keywords, or belonging to matching offices)
    const services = await Service.find({
      $and: [
        { $or: [{ status: 'ACTIVE' }, { isActive: true }, { status: { $exists: false } }] },
        {
          $or: [
            { name: regex },
            { code: regex },
            { description: regex },
            { category: regex },
            { officeId: { $in: matchingOfficeIds } }
          ]
        }
      ]
    }).populate('officeId', 'name code address department city state latitude longitude status isActive').limit(30).lean() as unknown as SearchServiceDoc[];

    // Enrich offices with QueueMetricsService and real distance calculation
    const enrichedOffices = await Promise.all(
      offices.map(async (off) => {
        const metrics = await QueueMetricsService.getOfficeMetrics(off._id);

        let distanceKm: number | null = null;
        if (
          hasValidCoords &&
          typeof off.latitude === 'number' &&
          typeof off.longitude === 'number' &&
          !isNaN(off.latitude) &&
          !isNaN(off.longitude)
        ) {
          const rawDist = calculateDistanceKm(userLat!, userLng!, off.latitude, off.longitude);
          distanceKm = Math.round(rawDist * 10) / 10;
        }

        return {
          _id: off._id,
          name: off.name,
          code: off.code,
          address: off.address || 'Address unavailable',
          department: off.department || off.city || 'General Administration',
          operatingHours: off.operatingHours || (typeof off.workingHours === 'string' ? off.workingHours : '09:00 AM - 05:00 PM'),
          status: off.status === 'ACTIVE' || off.isActive ? 'OPEN' : 'CLOSED',
          waitingCount: metrics.waitingCount,
          estimatedWaitMinutes: metrics.estimatedWaitMinutes,
          queueLoad: metrics.queueLoad?.level || 'LOW',
          activeCountersCount: metrics.activeCountersCount,
          distanceKm,
          distanceFormatted: formatDistance(distanceKm)
        };
      })
    );

    // Enrich services with QueueMetricsService and real distance calculation
    const enrichedServices = await Promise.all(
      services.map(async (svc) => {
        const officeId = svc.officeId?._id ? svc.officeId._id.toString() : undefined;
        const svcOffice = svc.officeId;
        const metrics = officeId
          ? await QueueMetricsService.getServiceMetrics(officeId, svc._id)
          : { waitingCount: 0, estimatedWaitMinutes: 0, queueLoad: { level: 'LOW' as const } };

        let svcDistanceKm: number | null = null;
        if (
          hasValidCoords &&
          svcOffice &&
          typeof svcOffice.latitude === 'number' &&
          typeof svcOffice.longitude === 'number' &&
          !isNaN(svcOffice.latitude) &&
          !isNaN(svcOffice.longitude)
        ) {
          const rawDist = calculateDistanceKm(userLat!, userLng!, svcOffice.latitude, svcOffice.longitude);
          svcDistanceKm = Math.round(rawDist * 10) / 10;
        }

        return {
          _id: svc._id,
          name: svc.name,
          code: svc.code,
          description: svc.description,
          category: svc.category || 'General',
          estimatedServiceTime: svc.estimatedServiceTime || svc.averageServiceTime || 15,
          fee: svc.fee || 0,
          office: svcOffice ? {
            _id: svcOffice._id,
            name: svcOffice.name,
            address: svcOffice.address || 'Address unavailable',
            department: svcOffice.department || 'General Administration',
            distanceKm: svcDistanceKm,
            distanceFormatted: formatDistance(svcDistanceKm)
          } : null,
          waitingCount: metrics.waitingCount,
          estimatedWaitMinutes: metrics.estimatedWaitMinutes,
          queueLoad: metrics.queueLoad?.level || 'LOW',
          distanceKm: svcDistanceKm,
          distanceFormatted: formatDistance(svcDistanceKm)
        };
      })
    );

    // Distance-aware sorting if user coordinates are available
    if (hasValidCoords) {
      enrichedOffices.sort((a, b) => {
        if (a.distanceKm === null && b.distanceKm === null) return 0;
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });

      enrichedServices.sort((a, b) => {
        if (a.distanceKm === null && b.distanceKm === null) return 0;
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        offices: enrichedOffices,
        services: enrichedServices,
        userLocation: hasValidCoords ? { lat: userLat, lng: userLng } : null
      }
    });

  } catch (error) {
    console.error('Citizen Search API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
