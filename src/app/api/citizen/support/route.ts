import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { SupportTicket } from '@/models/SupportTicket';
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

    const tickets = await SupportTicket.find({ userId: user.userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: tickets
    });

  } catch (error) {
    console.error('Citizen Support API GET error:', error);
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
    const { subject, category, message } = body;

    if (!subject || !message || typeof subject !== 'string' || typeof message !== 'string') {
      return NextResponse.json({ success: false, message: 'Subject and message are required' }, { status: 400 });
    }

    const ticket = await SupportTicket.create({
      userId: user.userId,
      subject: subject.trim(),
      category: typeof category === 'string' && category ? category.trim() : 'General Inquiry',
      message: message.trim(),
      status: 'OPEN'
    });

    await createAuditLog({
      action: 'CREATE_SUPPORT_TICKET',
      module: 'CITIZEN',
      description: `Citizen created support ticket: ${subject.trim()}`,
      entityType: 'SupportTicket',
      entityId: ticket._id.toString(),
      userId: user.userId,
      userRole: user.role,
      request: req
    });

    return NextResponse.json({
      success: true,
      message: 'Support ticket submitted successfully',
      data: ticket
    });

  } catch (error) {
    console.error('Citizen Support API POST error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
