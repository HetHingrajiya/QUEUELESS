import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Token, TokenStatus } from '@/models/Token';
import { QueueEvent } from '@/models/QueueEvent';
import { Office } from '@/models/Office';
import { getUserFromCookie } from '@/lib/auth';
import { calculateDistanceKm } from '@/lib/geo/distance';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { tokenId, tokenNumber, officeId, lat, lon } = body;

    let token = null;
    if (tokenId) {
      token = await Token.findById(tokenId).populate('officeId').populate('serviceId');
    } else if (tokenNumber) {
      token = await Token.findOne({
        tokenNumber: tokenNumber.toUpperCase().trim(),
        citizenId: user.userId,
        status: { $in: [TokenStatus.WAITING, TokenStatus.CHECKED_IN] }
      }).populate('officeId').populate('serviceId');
    } else {
      // Find current active waiting token for this citizen
      token = await Token.findOne({
        citizenId: user.userId,
        status: TokenStatus.WAITING
      }).populate('officeId').populate('serviceId').sort({ createdAt: -1 });
    }

    if (!token) {
      return NextResponse.json({ success: false, message: 'No valid active token found for check-in' }, { status: 404 });
    }

    if (token.citizenId.toString() !== user.userId) {
      return NextResponse.json({ success: false, message: 'Forbidden: You do not own this token' }, { status: 403 });
    }

    if (token.status === TokenStatus.CHECKED_IN) {
      return NextResponse.json({
        success: true,
        message: 'Token is already checked in',
        data: {
          tokenNumber: token.tokenNumber,
          checkInTime: token.checkInTime || new Date(),
          officeName: token.officeId?.name,
          serviceName: token.serviceId?.name
        }
      });
    }

    // Geofence check if coordinates provided
    if (lat != null && lon != null && token.officeId?.latitude != null && token.officeId?.longitude != null) {
      const distanceKm = calculateDistanceKm(lat, lon, token.officeId.latitude, token.officeId.longitude);
      // Allow check-in if within 1.0 km of the office
      if (distanceKm > 1.0) {
        return NextResponse.json({
          success: false,
          message: `You are too far from the office (${distanceKm.toFixed(1)} km away). Please check in upon arrival at the venue.`,
          distanceKm
        }, { status: 400 });
      }
    }

    token.status = TokenStatus.CHECKED_IN;
    token.checkInTime = new Date();
    await token.save();

    await QueueEvent.create({
      tokenId: token._id,
      officeId: token.officeId?._id,
      serviceId: token.serviceId?._id,
      eventType: 'CHECKED_IN'
    });

    return NextResponse.json({
      success: true,
      message: 'Check-in confirmed successfully!',
      data: {
        tokenNumber: token.tokenNumber,
        checkInTime: token.checkInTime,
        officeName: token.officeId?.name || 'Office',
        serviceName: token.serviceId?.name || 'Service',
        hallLocation: 'Waiting Hall • Main Floor'
      }
    });

  } catch (error: any) {
    console.error('Citizen Check-In API error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
