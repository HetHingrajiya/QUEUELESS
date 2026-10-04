import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import { Token, TokenStatus } from '@/models/Token';
import { User } from '@/models/User';
import { Office } from '@/models/Office';
import { Service } from '@/models/Service';
import { QueueEvent } from '@/models/QueueEvent';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    // In a real app we'd get the citizen from auth, here we fallback to finding one or creating
    const headersList = await headers();
    let email = headersList.get('x-user-email');
    
    // For demo/dev purposes, if no auth, we'll try to find a default citizen or create one
    let citizen = await User.findOne({ email, role: 'CITIZEN' });
    if (!citizen) {
      citizen = await User.findOne({ role: 'CITIZEN' });
      if (!citizen) {
        return NextResponse.json({ success: false, message: 'No citizen found' }, { status: 401 });
      }
    }

    const body = await req.json();
    const { officeId, serviceId } = body;

    if (!officeId || !serviceId) {
      return NextResponse.json({ success: false, message: 'Office ID and Service ID are required' }, { status: 400 });
    }

    const office = await Office.findById(officeId);
    if (!office) return NextResponse.json({ success: false, message: 'Office not found' }, { status: 404 });
    
    const service = await Service.findById(serviceId);
    if (!service) return NextResponse.json({ success: false, message: 'Service not found' }, { status: 404 });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Get number of tokens today to generate tokenNumber like A-001
    const todaysTokens = await Token.countDocuments({
      officeId,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    
    // Generate token number (e.g., A-145)
    // Could prefix based on service code
    const prefix = service.code ? service.code.substring(0, 1).toUpperCase() : 'A';
    const number = (todaysTokens + 1).toString().padStart(3, '0');
    const tokenNumber = `${prefix}-${number}`;

    const newToken = await Token.create({
      tokenNumber,
      citizenId: citizen._id,
      officeId: office._id,
      serviceId: service._id,
      status: TokenStatus.WAITING,
      queuePosition: todaysTokens + 1
    });

    await QueueEvent.create({
      tokenId: newToken._id,
      officeId,
      serviceId,
      eventType: 'token:created'
    });

    return NextResponse.json({
      success: true,
      message: 'Token generated successfully',
      data: {
        tokenId: newToken._id,
        tokenNumber: newToken.tokenNumber
      }
    });

  } catch (error: any) {
    console.error('Token Generation API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
