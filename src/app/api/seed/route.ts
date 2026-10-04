import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import { User, UserRole } from '@/models/User';
import { Organization } from '@/models/Organization';
import { Office } from '@/models/Office';
import { Service } from '@/models/Service';
import { Counter, CounterStatus } from '@/models/Counter';

export async function GET() {
  try {
    await dbConnect();

    // Clear existing data
    await User.deleteMany({});
    await Organization.deleteMany({});
    await Office.deleteMany({});
    await Service.deleteMany({});
    await Counter.deleteMany({});

    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Create Organization
    const org = await Organization.create({
      name: 'Gujarat Transport Department',
      code: 'GTD',
      description: 'Regional Transport Office (RTO)',
      status: 'ACTIVE',
    });

    // 2. Create Super Admin
    await User.create({
      fullName: 'Super Admin',
      email: 'admin@queueless.demo',
      password: passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: 'ACTIVE',
    });

    // 3. Create Offices
    const office1 = await Office.create({
      name: 'RTO Rajkot',
      code: 'RJT-01',
      organizationId: org._id,
      city: 'Rajkot',
      status: 'ACTIVE',
    });

    const office2 = await Office.create({
      name: 'RTO Ahmedabad',
      code: 'AHD-01',
      organizationId: org._id,
      city: 'Ahmedabad',
      status: 'ACTIVE',
    });

    // 4. Create Admins
    await User.create({
      fullName: 'Rajkot Admin',
      email: 'officeadmin@queueless.demo',
      password: passwordHash,
      role: UserRole.ADMIN,
      organizationId: org._id,
      officeId: office1._id,
      status: 'ACTIVE',
    });

    // 5. Create Services
    const servicesData = [
      { name: 'Driving Licence', code: 'DL', time: 5 },
      { name: 'Vehicle Registration', code: 'VR', time: 8 },
      { name: 'Permit', code: 'PR', time: 6 },
      { name: 'Address Change', code: 'AC', time: 4 },
      { name: 'Duplicate RC', code: 'DRC', time: 3 },
    ];

    const createdServices = [];
    for (const s of servicesData) {
      createdServices.push(
        await Service.create({
          name: s.name,
          code: s.code,
          officeId: office1._id,
          averageServiceTime: s.time,
          status: 'ACTIVE',
        })
      );
    }

    // 6. Create Staff
    const staffUser = await User.create({
      fullName: 'Staff Member 1',
      email: 'staff@queueless.demo',
      password: passwordHash,
      role: UserRole.STAFF,
      organizationId: org._id,
      officeId: office1._id,
      serviceId: createdServices[0]._id,
      status: 'ACTIVE',
    });

    // 7. Create Counters
    await Counter.create({
      number: '04',
      name: 'Counter 04',
      officeId: office1._id,
      serviceId: createdServices[0]._id,
      staffId: staffUser._id,
      status: CounterStatus.ACTIVE,
    });

    await Counter.create({
      number: '05',
      name: 'Counter 05',
      officeId: office1._id,
      serviceId: createdServices[1]._id,
      status: CounterStatus.OFFLINE,
    });

    // 8. Create Citizen
    await User.create({
      fullName: 'Demo Citizen',
      email: 'citizen@queueless.demo',
      password: passwordHash,
      role: UserRole.CITIZEN,
      status: 'ACTIVE',
    });

    return NextResponse.json({ success: true, message: 'Database seeded successfully' });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ success: false, message: 'Seed failed' }, { status: 500 });
  }
}
