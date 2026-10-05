import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { AuditLog } from '@/models/AuditLog';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    // Auth Check
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const query: any = {};

    // RBAC: Super admin sees all, admin sees only their organization
    if (user.role === 'ADMIN') {
      if (!user.organizationId) {
        return NextResponse.json({ error: 'Organization ID missing for Admin' }, { status: 403 });
      }
      query.organizationId = user.organizationId;
    } else if (user.role !== 'SUPER_ADMIN') {
      // For now, restrict staff/citizen, or implement specific logic
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Filters
    const search = searchParams.get('search');
    if (search) {
      query.$or = [
        { action: { $regex: search, $options: 'i' } },
        { module: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { entityType: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
      ];
    }

    const action = searchParams.get('action');
    if (action) query.action = action;

    const module = searchParams.get('module');
    if (module) query.module = module;

    const role = searchParams.get('role');
    if (role) query.userRole = role;

    const status = searchParams.get('status');
    if (status) query.status = status;

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email')
      .populate('organizationId', 'name')
      .populate('officeId', 'name')
      .lean();

    const total = await AuditLog.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Audit Logs fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
