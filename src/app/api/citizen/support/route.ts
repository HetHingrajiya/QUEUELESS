import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { SupportTicket } from '@/models/SupportTicket';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const tickets = await SupportTicket.find({ userId: user.userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: tickets
    });

  } catch (error: any) {
    console.error('Citizen Support API GET error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { subject, category, message } = body;

    if (!subject || !message) {
      return NextResponse.json({ success: false, message: 'Subject and message are required' }, { status: 400 });
    }

    const ticket = await SupportTicket.create({
      userId: user.userId,
      subject: subject.trim(),
      category: category ? category.trim() : 'General Inquiry',
      message: message.trim(),
      status: 'OPEN'
    });

    return NextResponse.json({
      success: true,
      message: 'Support ticket submitted successfully',
      data: ticket
    });

  } catch (error: any) {
    console.error('Citizen Support API POST error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
