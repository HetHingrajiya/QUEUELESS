import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Report } from '@/models/Report';
import { getUserFromCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();
    
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const query: any = {};
    if (user.role === 'ADMIN') {
      query.organizationId = user.organizationId;
    }

    const reports = await Report.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: reports });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();
    
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    const newReport = await Report.create({
      name: body.name || 'Custom Generated Report',
      type: body.type || 'PDF',
      organizationId: user.role === 'ADMIN' ? user.organizationId : (body.organizationId || null),
      generatedBy: user.userId,
      fileSize: `${(Math.random() * 5).toFixed(1)} MB`,
      status: 'COMPLETED'
    });

    await createAuditLog({
      action: 'CREATE',
      module: 'Reports',
      description: `Generated new report: ${newReport.name}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'Report',
      entityId: newReport._id.toString(),
      newData: newReport.toObject(),
      request,
    });

    return NextResponse.json({ success: true, message: 'Report generated successfully', data: newReport });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
