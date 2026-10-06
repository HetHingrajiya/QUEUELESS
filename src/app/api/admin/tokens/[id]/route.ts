import { NextResponse, NextRequest } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Token } from '@/models/Token';
import { UserRole } from '@/models/User';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    
    const user = await getUserFromCookie();
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const token = await Token.findById(id).lean();
    if (!token) {
      return NextResponse.json({ success: false, message: 'Token not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: token });
  } catch (error: any) {
    console.error('Fetch Token Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { status } = body;
    const { id } = await params;

    const token = await Token.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!token) {
      return NextResponse.json({ success: false, message: 'Token not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: token });
  } catch (error: any) {
    console.error('Update Token Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const token = await Token.findByIdAndDelete(id);
    
    if (!token) {
      return NextResponse.json({ success: false, message: 'Token not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Token deleted successfully' });
  } catch (error: any) {
    console.error('Delete Token Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
