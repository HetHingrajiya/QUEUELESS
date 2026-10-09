import { NextResponse, NextRequest } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { PriorityRule } from '@/models/PriorityRule';
import { User, UserRole } from '@/models/User';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    
    const user = await getUserFromCookie();
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const rule = await PriorityRule.findById(id).lean();
    if (!rule) {
      return NextResponse.json({ success: false, message: 'Priority rule not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rule });
  } catch (error: any) {
    console.error('Fetch Priority Rule Error:', error);
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
    const { name, description, priorityMultiplier, status } = body;
    const { id } = await params;

    const rule = await PriorityRule.findByIdAndUpdate(
      id,
      {
        name,
        description,
        priorityMultiplier: Number(priorityMultiplier),
        status
      },
      { returnDocument: 'after' }
    );

    if (!rule) {
      return NextResponse.json({ success: false, message: 'Priority rule not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rule });
  } catch (error: any) {
    console.error('Update Priority Rule Error:', error);
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
    const rule = await PriorityRule.findByIdAndDelete(id);
    
    if (!rule) {
      return NextResponse.json({ success: false, message: 'Priority rule not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Priority rule deleted successfully' });
  } catch (error: any) {
    console.error('Delete Priority Rule Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
