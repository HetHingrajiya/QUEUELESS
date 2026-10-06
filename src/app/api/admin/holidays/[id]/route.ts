import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Holiday } from '@/models/Holiday';
import { getUserFromCookie } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const user = await getUserFromCookie();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const holiday = await Holiday.findOne({ _id: id, organizationId: user.organizationId });
    if (!holiday) {
      return NextResponse.json({ success: false, message: 'Holiday not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: holiday });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const user = await requirePermission('holidays', 'modify');
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { name, date, description } = body;

    const updated = await Holiday.findOneAndUpdate(
      { _id: id, organizationId: user.organizationId },
      { $set: { name, date, description } },
      { new: true, runValidators: true }
    );
    
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Holiday not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'A holiday already exists on this date' }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const user = await requirePermission('holidays', 'delete');
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const deleted = await Holiday.findOneAndDelete({ _id: id, organizationId: user.organizationId });
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Holiday not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Holiday deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
