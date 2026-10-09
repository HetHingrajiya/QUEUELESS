import { NextResponse } from 'next/server';

// Demo seeding previously deleted live collections and inserted fixed demo accounts.
// Keep this endpoint disabled so it can never pollute or destroy real QueueLess data.
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: 'Database seeding endpoint is disabled. Use a reviewed, environment-specific migration for development data.',
    },
    { status: 410 },
  );
}

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: 'Database seeding endpoint is disabled. Use a reviewed, environment-specific migration for development data.',
    },
    { status: 410 },
  );
}
