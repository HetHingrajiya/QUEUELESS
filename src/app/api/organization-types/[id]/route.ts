import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { OrganizationType } from '@/models/OrganizationType';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const type = await OrganizationType.findById(params.id);
    if (!type) {
      return NextResponse.json({ success: false, message: 'Organization Type not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: type });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const body = await request.json();
    const type = await OrganizationType.findByIdAndUpdate(params.id, body, { new: true, runValidators: true });
    
    if (!type) {
      return NextResponse.json({ success: false, message: 'Organization Type not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: type });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'Organization type with this name already exists' }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const type = await OrganizationType.findByIdAndDelete(params.id);
    
    if (!type) {
      return NextResponse.json({ success: false, message: 'Organization Type not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Organization Type deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
