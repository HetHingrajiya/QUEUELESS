import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import { Counter } from '@/models/Counter';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    
    const counter = await Counter.findById(params.id);
    
    if (!counter) {
      return NextResponse.json({ success: false, message: 'Counter not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: counter
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
    
    const updatedCounter = await Counter.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedCounter) {
      return NextResponse.json({ success: false, message: 'Counter not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Counter updated successfully',
      data: updatedCounter
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

    const deletedCounter = await Counter.findByIdAndDelete(params.id);

    if (!deletedCounter) {
      return NextResponse.json({ success: false, message: 'Counter not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Counter deleted successfully'
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
