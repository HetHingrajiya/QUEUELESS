import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import { Office } from '@/models/Office';
import { getUserFromCookie } from '@/lib/auth';

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
    
    const updatedOffice = await Office.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedOffice) {
      return NextResponse.json({ success: false, message: 'Office not found' }, { status: 404 });
    }

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

    const deletedOffice = await Office.findByIdAndDelete(id);

    if (!deletedOffice) {
      return NextResponse.json({ success: false, message: 'Office not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Office deleted successfully'
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
