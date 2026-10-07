import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Counter } from '@/models/Counter';
import { User } from '@/models/User';

export async function GET() {
  await dbConnect();
  const staffs = await User.find({ role: 'STAFF' }).lean();
  const counters = await Counter.find().lean();
  
  return NextResponse.json({ staffs, counters });
}
