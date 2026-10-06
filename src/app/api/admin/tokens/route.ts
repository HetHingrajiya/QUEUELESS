import { NextResponse, NextRequest } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Token } from '@/models/Token';
import { User, UserRole } from '@/models/User';
import { Office } from '@/models/Office';
import { Service } from '@/models/Service';
import { createAuditLog } from '@/lib/auditLogger';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const user = await getUserFromCookie();
    
    if (!user || user.role === 'CITIZEN' || user.role === 'STAFF') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    // RBAC
    if (user.role === 'ADMIN') {
      const { hasPermission } = await import('@/lib/permissions');
      const canManageQueue = await hasPermission(user.userId, 'MANAGE_QUEUE');
      if (!canManageQueue) {
        return NextResponse.json({ success: false, message: 'Forbidden: Missing MANAGE_QUEUE permission' }, { status: 403 });
      }
    }

    let officeQuery: any = {};

    if (user.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN sees all tokens across all offices
    } else if (user.organizationId) {
      const offices = await Office.find({ organizationId: user.organizationId }).lean();
      const officeIds = offices.map(o => o._id);
      
      if (officeIds.length > 0) {
        officeQuery = { officeId: { $in: officeIds } };
      } else {
        return NextResponse.json({ success: true, data: [] });
      }
    } else {
       return NextResponse.json({ success: false, message: 'Admin has no organization assigned' }, { status: 404 });
    }

    // Get all tokens
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
    if (!user || user.role === 'CITIZEN' || user.role === 'STAFF') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    // RBAC
    if (user.role === 'ADMIN') {
      const { hasPermission } = await import('@/lib/permissions');
      const canManageQueue = await hasPermission(user.userId, 'MANAGE_QUEUE');
      if (!canManageQueue) {
        return NextResponse.json({ success: false, message: 'Forbidden: Missing MANAGE_QUEUE permission' }, { status: 403 });
      }
    }

    const body = await req.json();
    const { officeId, serviceId, citizenEmail } = body;

    if (!officeId || !serviceId) {
      return NextResponse.json({ success: false, message: 'Office ID and Service ID are required' }, { status: 400 });
    }

    const office = await Office.findById(officeId).lean();
    if (!office) {
      return NextResponse.json({ success: false, message: 'Office not found' }, { status: 404 });
    }

    if (user.role === 'ADMIN' && office.organizationId?.toString() !== user.organizationId) {
       return NextResponse.json({ success: false, message: 'Unauthorized office' }, { status: 403 });
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

    await createAuditLog({
      action: 'CREATE',
      module: 'Queue',
      description: `Admin created token: ${newToken.tokenNumber}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'Token',
      entityId: newToken._id.toString(),
      organizationId: office.organizationId,
      request: req,
    });

    return NextResponse.json({ success: true, data: newToken });
  } catch (error: any) {
    console.error('Create Token Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
