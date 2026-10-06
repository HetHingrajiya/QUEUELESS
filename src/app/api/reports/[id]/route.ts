import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Report } from '@/models/Report';
import { getUserFromCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';
import { requirePermission } from '@/lib/rbac';
import mongoose from 'mongoose';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    const user = await getUserFromCookie();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid report ID' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format');

    const report = await Report.findById(id).populate('generatedBy', 'fullName email');
    if (!report) {
      return NextResponse.json({ success: false, message: 'Report not found' }, { status: 404 });
    }

    // Org isolation for admins
    if (user.role === 'ADMIN' && report.organizationId?.toString() !== user.organizationId) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // CSV download
    if (format === 'csv') {
      const s = report.summaryData || {};
      const lines: string[] = [
        `"Report Name","${report.name}"`,
        `"Report Type","${report.reportType}"`,
        `"Date Range","${new Date(report.dateRangeStart).toLocaleDateString()} – ${new Date(report.dateRangeEnd).toLocaleDateString()}"`,
        `"Generated","${new Date(report.createdAt).toLocaleString()}"`,
        ``,
        `"SUMMARY"`,
        `"Total Tokens","Completed","Waiting","Serving","Cancelled","Skipped","No-Show","Avg Wait (min)","Avg Service (min)","No-show Rate","Completion Rate"`,
        `${s.total ?? 0},${s.completed ?? 0},${s.waiting ?? 0},${s.serving ?? 0},${s.cancelled ?? 0},${s.skipped ?? 0},${s.noShow ?? 0},${s.avgWaitMin ?? 0},${s.avgServiceMin ?? 0},"${s.noShowRate ?? '0.0'}%","${s.completionRate ?? '0.0'}%"`,
        ``,
        `"DAILY BREAKDOWN"`,
        `"Date","Tokens"`,
        ...(report.dailyBreakdown || []).map((d: any) => `"${d.day}",${d.count}`),
        ``,
        `"OFFICE BREAKDOWN"`,
        `"Office","Total","Completed"`,
        ...(report.officeBreakdown || []).map((o: any) => `"${o.name || 'N/A'}",${o.total},${o.completed}`),
        ``,
        `"SERVICE BREAKDOWN"`,
        `"Service","Total","Completed"`,
        ...(report.serviceBreakdown || []).map((s: any) => `"${s.name || 'N/A'}",${s.total},${s.completed}`),
      ];

      const csv = lines.join('\n');
      const filename = `${report.name.replace(/\s+/g, '_')}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        }
      });
    }

    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    const user = await requirePermission('reports', 'delete');
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid report ID' }, { status: 400 });
    }

    const report = await Report.findById(id);
    if (!report) {
      return NextResponse.json({ success: false, message: 'Report not found' }, { status: 404 });
    }
    if (user.role === 'ADMIN' && report.organizationId?.toString() !== user.organizationId) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await report.deleteOne();

    await createAuditLog({
      action: 'DELETE',
      module: 'Reports',
      description: `Deleted report: ${report.name}`,
      userId: user.userId,
      userRole: user.role,
      entityType: 'Report',
      entityId: id,
      request: req,
    });

    return NextResponse.json({ success: true, message: 'Report deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
