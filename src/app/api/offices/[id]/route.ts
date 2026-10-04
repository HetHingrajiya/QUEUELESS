import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import { Office } from '@/models/Office';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    
    const office = await Office.findById(params.id);
    
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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    
    // Auth Check
    const userRole = req.headers.get('x-user-role');
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    
    const updatedOffice = await Office.findByIdAndUpdate(
      params.id,
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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    
    // Auth Check
    const userRole = req.headers.get('x-user-role');
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const deletedOffice = await Office.findByIdAndDelete(params.id);

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
