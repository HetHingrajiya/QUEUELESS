import { NextResponse, NextRequest } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Token } from '@/models/Token';
import { User, UserRole } from '@/models/User';
import { Office } from '@/models/Office';
import { Service } from '@/models/Service';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const user = await getUserFromCookie();
    const role = user?.role;
    
    if (role !== UserRole.ADMIN && role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const adminUser = await User.findById(user?.userId).lean();
    if (!adminUser) {
       return NextResponse.json({ success: false, message: 'Admin user not found' }, { status: 404 });
    }

    let officeQuery: any = {};

    if (role === UserRole.SUPER_ADMIN) {
      // SUPER_ADMIN sees all tokens across all offices
    } else if (adminUser.organizationId) {
      const offices = await Office.find({ organizationId: adminUser.organizationId }).lean();
      const officeIds = offices.map(o => o._id);
      
      if (officeIds.length > 0) {
        officeQuery = { officeId: { $in: officeIds } };
      } else {
        return NextResponse.json({ success: true, data: [] });
      }
    } else {
       return NextResponse.json({ success: false, message: 'Admin has no organization assigned' }, { status: 404 });
    }

    // Get all tokens (could add pagination later)
    const tokens = await Token.find(officeQuery)
      .sort({ createdAt: -1 })
      .populate('serviceId', 'name')
      .populate('officeId', 'name')
      .lean();

    return NextResponse.json({
      success: true,
      data: tokens.map((t: any) => ({
        id: t._id,
        tokenNumber: t.tokenNumber,
        service: t.serviceId?.name || 'Unknown',
        office: t.officeId?.name || 'Unknown',
        status: t.status,
        createdAt: t.createdAt
      }))
    });

  } catch (error: any) {
    console.error('Admin Tokens API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const user = await getUserFromCookie();
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { officeId, serviceId, citizenEmail } = body;

    if (!officeId || !serviceId) {
      return NextResponse.json({ success: false, message: 'Office ID and Service ID are required' }, { status: 400 });
    }

    let citizenId = user.userId;
    if (citizenEmail) {
      const citizen = await User.findOne({ email: citizenEmail });
      if (citizen) {
        citizenId = citizen._id as string;
      } else {
        return NextResponse.json({ success: false, message: 'Citizen with that email not found' }, { status: 404 });
      }
    }

    // Generate Token Number logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tokenCount = await Token.countDocuments({ 
      officeId, 
      serviceId,
      createdAt: { $gte: today } 
    });

    const service = await Service.findById(serviceId);
    if (!service) {
      return NextResponse.json({ success: false, message: 'Service not found' }, { status: 404 });
    }

    const tokenNumber = `${service.code}-${(tokenCount + 1).toString().padStart(3, '0')}`;

    const newToken = await Token.create({
      tokenNumber,
      citizenId,
      officeId,
      serviceId,
      status: 'WAITING',
    });

    return NextResponse.json({ success: true, data: newToken });
  } catch (error: any) {
    console.error('Create Token Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
