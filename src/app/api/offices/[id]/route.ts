import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import { Office } from '@/models/Office';
import { getUserFromCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    const { id } = await params;
    
    const office = await Office.findById(id);
    
    if (!office) {
      return NextResponse.json({ success: false, message: 'Office not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: office
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    const { id } = await params;
    
    // Auth Check
    const currentUser = await getUserFromCookie();
    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    
    const oldOffice = await Office.findById(id);
    if (!oldOffice) {
      return NextResponse.json({ success: false, message: 'Office not found' }, { status: 404 });
    }

    const updatedOffice = await Office.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedOffice) {
      return NextResponse.json({ success: false, message: 'Office not found' }, { status: 404 });
    }

    await createAuditLog({
      action: 'UPDATE',
      module: 'Offices',
      description: `Updated office: ${updatedOffice.name}`,
      userId: currentUser.userId,
      userRole: currentUser.role,
      entityType: 'Office',
      entityId: id,
      oldData: oldOffice.toObject(),
      newData: updatedOffice.toObject(),
      request: req,
    });

    return NextResponse.json({
      success: true,
      message: 'Office updated successfully',
      data: updatedOffice
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    const { id } = await params;
    
    // Auth Check
    const currentUser = await getUserFromCookie();
    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const oldOffice = await Office.findById(id);
    if (!oldOffice) {
      return NextResponse.json({ success: false, message: 'Office not found' }, { status: 404 });
    }

    const deletedOffice = await Office.findByIdAndDelete(id);

    if (!deletedOffice) {
      return NextResponse.json({ success: false, message: 'Office not found' }, { status: 404 });
    }

    await createAuditLog({
      action: 'DELETE',
      module: 'Offices',
      description: `Deleted office: ${oldOffice.name}`,
      userId: currentUser.userId,
      userRole: currentUser.role,
      entityType: 'Office',
      entityId: id,
      oldData: oldOffice.toObject(),
      request: req,
    });

    return NextResponse.json({
      success: true,
      message: 'Office deleted successfully'
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
