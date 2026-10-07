import { NextResponse, NextRequest } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Token } from '@/models/Token';
import { Counter } from '@/models/Counter';
import { User, UserRole } from '@/models/User';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    
    const user = await getUserFromCookie();
    if (!user || user.role !== UserRole.STAFF) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const staffUser = await User.findById(user.userId).lean();
    if (!staffUser || !staffUser.officeId) {
       return NextResponse.json({ success: false, message: 'Staff user or office not found' }, { status: 404 });
    }

    const counter = await Counter.findOne({ staffId: staffUser._id }).lean();
    if (!counter) {
      return NextResponse.json({ success: false, message: 'No counter assigned to this staff member' }, { status: 404 });
    }
    
    const serviceIdsArray = counter.serviceIds || [];

    const token = await Token.findOne({
      _id: id,
      officeId: counter.officeId,
      serviceId: { $in: serviceIdsArray.map((s: any) => s._id) }
    })
    .populate('serviceId', 'name')
    .populate('citizenId', 'fullName email mobile')
    .populate('counterId', 'name')
    .populate('officeId', 'name')
    .lean();

    if (!token) {
      return NextResponse.json({ success: false, message: 'Token not found or access denied' }, { status: 404 });
    }

    // Since we don't have a robust QueueEvent model visible, we will extract the key timestamps directly from the token.
    const events = [];
    if (token.createdAt) {
      events.push({ type: 'CREATED', time: token.createdAt, note: 'Token created' });
    }
    if (token.callTime) {
      events.push({ type: 'CALLED', time: token.callTime, note: 'Token called to counter' });
    }
    if (token.startTime) {
      events.push({ type: 'STARTED', time: token.startTime, note: 'Service started' });
    }
    if (token.endTime) {
      events.push({ type: 'COMPLETED/NO SHOW', time: token.endTime, note: `Token marked as ${token.status}` });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...token,
        events: events.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
      }
    });

  } catch (error: any) {
    console.error('Staff Token Detail API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
