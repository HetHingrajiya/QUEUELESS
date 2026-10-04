import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { OrganizationType } from '@/models/OrganizationType';

export async function GET() {
  try {
    await dbConnect();
    const types = await OrganizationType.find({}).sort({ name: 1 });
    return NextResponse.json({ success: true, data: types });
  } catch (error) {
    console.error('Error fetching organization types:', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    }

    const type = await OrganizationType.create(body);
    return NextResponse.json({ success: true, data: type }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating organization type:', error);
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'Organization type with this name already exists' }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
