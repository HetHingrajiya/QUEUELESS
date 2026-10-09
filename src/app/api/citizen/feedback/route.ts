import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Feedback } from '@/models/Feedback';
import { Office } from '@/models/Office';
import { Service } from '@/models/Service';
import { Token } from '@/models/Token';
import { getUserFromCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';

export async function GET() {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || !user.userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    interface PopulatedFeedbackDoc {
      _id: mongoose.Types.ObjectId;
      officeId?: { name?: string };
      serviceId?: { name?: string };
      tokenId?: { tokenNumber?: string };
      rating: number;
      courtesyRating?: number;
      waitAccuracyRating?: number;
      cleanlinessRating?: number;
      comment?: string;
      officeResponse?: string;
      status?: string;
      createdAt: Date;
    }

    const feedbacks = await Feedback.find({ userId: user.userId })
      .populate('officeId', 'name address')
      .populate('serviceId', 'name')
      .populate('tokenId', 'tokenNumber')
      .sort({ createdAt: -1 })
      .lean() as unknown as PopulatedFeedbackDoc[];

    const formatted = feedbacks.map((fb) => ({
      _id: fb._id,
      officeName: fb.officeId?.name || 'Office',
      serviceName: fb.serviceId?.name || 'General Visit',
      tokenNumber: fb.tokenId?.tokenNumber,
      rating: fb.rating,
      courtesyRating: fb.courtesyRating,
      waitAccuracyRating: fb.waitAccuracyRating,
      cleanlinessRating: fb.cleanlinessRating,
      comment: fb.comment,
      officeResponse: fb.officeResponse,
      status: fb.status || 'SUBMITTED',
      createdAt: fb.createdAt
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Citizen Feedback GET error:', error);
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
    const { officeId, serviceId, tokenId, rating, courtesyRating, waitAccuracyRating, cleanlinessRating, comment } = body;

    // Validate overall rating
    if (rating === undefined || rating === null) {
      return NextResponse.json({ success: false, message: 'Rating is required' }, { status: 400 });
    }

    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ success: false, message: 'Rating must be an integer between 1 and 5' }, { status: 400 });
    }

    // Validate category ratings (1-5 each)
    const categoryRatings = { courtesyRating, waitAccuracyRating, cleanlinessRating };
    for (const [key, val] of Object.entries(categoryRatings)) {
      if (val !== undefined && val !== null) {
        const numVal = Number(val);
        if (!Number.isInteger(numVal) || numVal < 1 || numVal > 5) {
          return NextResponse.json({ 
            success: false, 
            message: `${key} must be an integer between 1 and 5` 
          }, { status: 400 });
        }
      }
    }

    // Validate comment length (sensible server-side limit: 1000 chars)
    if (comment !== undefined && comment !== null) {
      if (typeof comment !== 'string') {
        return NextResponse.json({ success: false, message: 'Comment must be text' }, { status: 400 });
      }
      if (comment.length > 1000) {
        return NextResponse.json({ success: false, message: 'Comment cannot exceed 1000 characters' }, { status: 400 });
      }
    }

    let resolvedOfficeId = officeId;
    let resolvedServiceId = serviceId;

    // 1. TOKEN OWNERSHIP & RELATIONSHIP VALIDATION
    if (tokenId) {
      if (!mongoose.Types.ObjectId.isValid(tokenId)) {
        return NextResponse.json({ success: false, message: 'Invalid Token ID' }, { status: 400 });
      }
      
      const token = await Token.findById(tokenId);
      if (!token) {
        return NextResponse.json({ success: false, message: 'Token not found' }, { status: 404 });
      }

      // Token Ownership Rule
      if (token.citizenId?.toString() !== user.userId) {
        return NextResponse.json({ 
          success: false, 
          message: 'Forbidden: You can only submit feedback for your own token.' 
        }, { status: 403 });
      }

      // Completion Rule: rating for a token only allowed when token is COMPLETED
      if (token.status !== 'COMPLETED') {
        return NextResponse.json({ 
          success: false, 
          message: 'Service rating can only be submitted for completed tokens.' 
        }, { status: 400 });
      }

      // Office Match Rule: if officeId is supplied, it must match token.officeId
      if (officeId) {
        if (!mongoose.Types.ObjectId.isValid(officeId)) {
          return NextResponse.json({ success: false, message: 'Invalid Office ID' }, { status: 400 });
        }
        if (token.officeId && token.officeId.toString() !== officeId.toString()) {
          return NextResponse.json({ 
            success: false, 
            message: 'Token does not belong to the selected office.' 
          }, { status: 400 });
        }
      } else {
        resolvedOfficeId = token.officeId?.toString();
      }

      // Service Match Rule: if serviceId is supplied, it must match token.serviceId
      if (serviceId) {
        if (!mongoose.Types.ObjectId.isValid(serviceId)) {
          return NextResponse.json({ success: false, message: 'Invalid Service ID' }, { status: 400 });
        }
        if (token.serviceId && token.serviceId.toString() !== serviceId.toString()) {
          return NextResponse.json({ 
            success: false, 
            message: 'Token does not match the selected service.' 
          }, { status: 400 });
        }
      } else {
        resolvedServiceId = token.serviceId?.toString();
      }

      // Duplicate Rating Rule: one service rating per completed token
      const existing = await Feedback.findOne({ tokenId });
      if (existing) {
        return NextResponse.json({ 
          success: false, 
          message: 'Feedback has already been submitted for this token.' 
        }, { status: 400 });
      }
    }

    // 2. GENERAL FEEDBACK VALIDATION (when no tokenId provided)
    if (!resolvedOfficeId || !mongoose.Types.ObjectId.isValid(resolvedOfficeId)) {
      return NextResponse.json({ success: false, message: 'Valid Office ID is required' }, { status: 400 });
    }

    const office = await Office.findById(resolvedOfficeId);
    if (!office) {
      return NextResponse.json({ success: false, message: 'Office not found' }, { status: 404 });
    }

    if (resolvedServiceId) {
      if (!mongoose.Types.ObjectId.isValid(resolvedServiceId)) {
        return NextResponse.json({ success: false, message: 'Invalid Service ID' }, { status: 400 });
      }
      const service = await Service.findById(resolvedServiceId);
      if (!service) {
        return NextResponse.json({ success: false, message: 'Service not found' }, { status: 404 });
      }
      if (service.officeId && service.officeId.toString() !== resolvedOfficeId.toString()) {
        return NextResponse.json({ success: false, message: 'Service does not belong to the specified office' }, { status: 400 });
      }
    }

    const newFeedback = await Feedback.create({
      userId: user.userId, // Always authenticated user
      officeId: resolvedOfficeId,
      serviceId: resolvedServiceId || undefined,
      tokenId: tokenId || undefined,
      rating: numericRating,
      courtesyRating: courtesyRating ? Number(courtesyRating) : undefined,
      waitAccuracyRating: waitAccuracyRating ? Number(waitAccuracyRating) : undefined,
      cleanlinessRating: cleanlinessRating ? Number(cleanlinessRating) : undefined,
      comment: typeof comment === 'string' ? comment.trim() : undefined,
      status: 'SUBMITTED'
    });

    await createAuditLog({
      action: 'SUBMIT_FEEDBACK',
      module: 'CITIZEN',
      description: `Citizen submitted rating (${numericRating}/5) for office ${office.name}`,
      entityType: 'Feedback',
      entityId: newFeedback._id.toString(),
      userId: user.userId,
      userRole: user.role,
      officeId: resolvedOfficeId,
      request: req
    });

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: newFeedback
    });
  } catch (error) {
    console.error('Citizen Feedback POST error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
