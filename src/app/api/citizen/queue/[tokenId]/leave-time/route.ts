import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import { Token } from '@/models/Token';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tokenId: string }> }) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user || user.role !== 'CITIZEN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }
    
    const { tokenId } = await params;

    const myToken = await Token.findById(tokenId).populate('serviceId', 'name').populate('officeId', 'name').lean();
    
    if (!myToken) {
      return NextResponse.json({ success: false, message: 'Token not found' }, { status: 404 });
    }

    if (myToken.citizenId?.toString() !== user.userId) {
       return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        travelTimeAvailable: false, // Since we don't have a Google Maps / Routing API setup yet
        message: 'Travel time unavailable'
      }
    });

  } catch (error: any) {
    console.error('Citizen Leave Time API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
