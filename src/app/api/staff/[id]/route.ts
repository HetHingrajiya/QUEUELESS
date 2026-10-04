import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import { User, UserRole } from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    
    const staff = await User.findOne({ _id: params.id, role: UserRole.STAFF });
    
    if (!staff) {
      return NextResponse.json({ success: false, message: 'Staff not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: staff
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
    
    if (body.password) {
      body.password = await bcrypt.hash(body.password, 10);
    } else {
      delete body.password; // Don't overwrite with empty password
    }

    const updatedStaff = await User.findOneAndUpdate(
      { _id: params.id, role: UserRole.STAFF },
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedStaff) {
      return NextResponse.json({ success: false, message: 'Staff not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Staff updated successfully',
      data: updatedStaff
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

    const deletedStaff = await User.findOneAndDelete({ _id: params.id, role: UserRole.STAFF });

    if (!deletedStaff) {
      return NextResponse.json({ success: false, message: 'Staff not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Staff deleted successfully'
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
