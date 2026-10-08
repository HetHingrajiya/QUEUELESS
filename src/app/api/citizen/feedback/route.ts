import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Feedback } from '@/models/Feedback';
import { Office } from '@/models/Office';
import { Service } from '@/models/Service';
import { Token } from '@/models/Token';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const feedbacks = await Feedback.find({ userId: user.userId })
      .populate('officeId', 'name address')
      .populate('serviceId', 'name')
      .populate('tokenId', 'tokenNumber')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = feedbacks.map((fb: any) => ({
      _id: fb._id,
      officeName: fb.officeId?.name || 'Government Office',
      serviceName: fb.serviceId?.name || 'General Citizen Service',
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
  } catch (error: any) {
    console.error('Citizen Feedback GET error:', error);
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
    const { officeId, serviceId, tokenId, rating, courtesyRating, waitAccuracyRating, cleanlinessRating, comment } = body;

    if (!officeId || !rating) {
      return NextResponse.json({ success: false, message: 'Office ID and Rating are required' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, message: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const newFeedback = await Feedback.create({
      userId: user.userId,
      officeId,
      serviceId,
      tokenId,
      rating,
      courtesyRating,
      waitAccuracyRating,
      cleanlinessRating,
      comment: comment?.trim(),
      status: 'SUBMITTED'
    });

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: newFeedback
    });
  } catch (error: any) {
    console.error('Citizen Feedback POST error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
