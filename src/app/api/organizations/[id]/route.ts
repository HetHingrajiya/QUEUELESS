import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Organization } from '@/models/Organization';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const org = await Organization.findById(resolvedParams.id);
    if (!org) {
      return NextResponse.json({ success: false, message: 'Organization not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: org });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const body = await request.json();
    const org = await Organization.findByIdAndUpdate(resolvedParams.id, body, { new: true, runValidators: true });
    
    if (!org) {
      return NextResponse.json({ success: false, message: 'Organization not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: org });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'Organization with this code already exists' }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const org = await Organization.findByIdAndDelete(resolvedParams.id);
    
    if (!org) {
      return NextResponse.json({ success: false, message: 'Organization not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Organization deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
