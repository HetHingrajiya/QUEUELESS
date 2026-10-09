import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Token, TokenStatus } from '@/models/Token';
import { QueueEvent } from '@/models/QueueEvent';
import { getUserFromCookie } from '@/lib/auth';
import { calculateDistanceKm } from '@/lib/geo/distance';
import { createAuditLog } from '@/lib/auditLogger';
import { canCheckIn, QueueEventTypes } from '@/lib/queue';

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
    const { tokenId, tokenNumber, lat, lon } = body;

    let token = null;
    if (tokenId) {
      if (!mongoose.Types.ObjectId.isValid(tokenId)) {
        return NextResponse.json({ success: false, message: 'Invalid token ID' }, { status: 400 });
      }
      token = await Token.findById(tokenId).populate('officeId').populate('serviceId');
    } else if (tokenNumber && typeof tokenNumber === 'string') {
      token = await Token.findOne({
        tokenNumber: tokenNumber.toUpperCase().trim(),
        citizenId: user.userId,
        status: { $in: [TokenStatus.WAITING, TokenStatus.CALLED, TokenStatus.CHECKED_IN] }
      }).populate('officeId').populate('serviceId');
    } else {
      // Find current active waiting or called token for this authenticated citizen
      token = await Token.findOne({
        citizenId: user.userId,
        status: { $in: [TokenStatus.WAITING, TokenStatus.CALLED] }
      }).populate('officeId').populate('serviceId').sort({ createdAt: -1 });
    }

    if (!token) {
      return NextResponse.json({ success: false, message: 'No valid active token found for check-in' }, { status: 404 });
    }

    if (token.citizenId.toString() !== user.userId) {
      return NextResponse.json({ success: false, message: 'Forbidden: You do not own this token' }, { status: 403 });
    }

    const checkInValidation = canCheckIn(token.status);
    if (!checkInValidation.allowed) {
      return NextResponse.json({
        success: false,
        message: checkInValidation.reason || 'Token cannot be checked in'
      }, { status: 400 });
    }

    if (checkInValidation.isIdempotent) {
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
      eventType: QueueEventTypes.CHECKED_IN
    });

    await createAuditLog({
      action: 'CHECK_IN',
      module: 'CITIZEN_QUEUE',
      description: `Citizen checked in for token ${token.tokenNumber}`,
      entityType: 'Token',
      entityId: token._id.toString(),
      userId: user.userId,
      userRole: user.role,
      officeId: token.officeId?._id?.toString(),
      request: req
    });

    try {
      const { getSocket } = await import('@/lib/socketClient');
      const socket = getSocket();
      const officeIdStr = token.officeId?._id?.toString();
      const tokenIdStr = token._id.toString();

      socket.emit('queue:action', { 
        action: 'CHECK_IN', 
        officeId: officeIdStr, 
        tokenId: tokenIdStr, 
        status: token.status 
      });
      socket.emit('queue:updated', { 
        officeId: officeIdStr, 
        serviceId: token.serviceId?._id?.toString() 
      });
      socket.emit('token:checked_in', { 
        tokenId: tokenIdStr, 
        tokenNumber: token.tokenNumber,
        officeId: officeIdStr 
      });
    } catch {
      // socket broadcast optional
    }

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

  } catch (error) {
    console.error('Citizen Check-In API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
