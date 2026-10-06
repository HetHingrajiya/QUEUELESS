import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Holiday } from '@/models/Holiday';
import { getUserFromCookie } from '@/lib/auth';
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const holidays = await Holiday.find({ organizationId: user.organizationId }).sort({ date: 1 });
    return NextResponse.json({ success: true, data: holidays });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { name, date, description } = body;

    if (!name || !date) {
      return NextResponse.json({ success: false, message: 'Name and date are required' }, { status: 400 });
    }

    const newHoliday = await Holiday.create({
      name,
      date,
      description,
      organizationId: user.organizationId,
    });

    return NextResponse.json({ success: true, data: newHoliday }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'A holiday already exists on this date' }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
