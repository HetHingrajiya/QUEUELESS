import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { SystemSettings } from '@/models/SystemSettings';
import { getUserFromCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';
import { hasPermission } from '@/lib/permissions';


export async function GET(request: Request) {
  try {
    await dbConnect();
    
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('System settings GET error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect();
    
    // Auth + permission check: system settings are restricted to SUPER_ADMIN
    // and ADMIN users explicitly granted MANAGE_SETTINGS.
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'SUPER_ADMIN' && !(user.role === 'ADMIN' && await hasPermission(user.userId, 'MANAGE_SETTINGS'))) {
      return NextResponse.json({ success: false, message: 'Forbidden: Missing MANAGE_SETTINGS permission' }, { status: 403 });
    }

    const body = await request.json();
    
    let settings = await SystemSettings.findOne();
    let oldData = null;
    
    if (!settings) {
      settings = new SystemSettings();
    } else {
      oldData = settings.toObject();
    }

    settings.maxQueueSize = body.maxQueueSize ?? settings.maxQueueSize;
    settings.noShowTimeout = body.noShowTimeout ?? settings.noShowTimeout;
    settings.checkInBuffer = body.checkInBuffer ?? settings.checkInBuffer;
    settings.aiRefreshRate = body.aiRefreshRate ?? settings.aiRefreshRate;
    settings.sessionTimeout = body.sessionTimeout ?? settings.sessionTimeout;
    settings.passwordExpiry = body.passwordExpiry ?? settings.passwordExpiry;
    
    // Queue Algorithms
    if (body.enableAIPrediction !== undefined) settings.enableAIPrediction = body.enableAIPrediction;
    if (body.historicalWeight !== undefined) settings.historicalWeight = body.historicalWeight;
    if (body.liveVelocityWeight !== undefined) settings.liveVelocityWeight = body.liveVelocityWeight;
    if (body.maxDailyTokensPerUser !== undefined) settings.maxDailyTokensPerUser = body.maxDailyTokensPerUser;
    if (body.maxConcurrentTokens !== undefined) settings.maxConcurrentTokens = body.maxConcurrentTokens;
    
    // Notifications
    if (body.smsEnabled !== undefined) settings.smsEnabled = body.smsEnabled;
    if (body.pushEnabled !== undefined) settings.pushEnabled = body.pushEnabled;
    if (body.emailEnabled !== undefined) settings.emailEnabled = body.emailEnabled;
    if (body.notifyPeopleAhead !== undefined) settings.notifyPeopleAhead = body.notifyPeopleAhead;
    if (body.notifyMinutesAhead !== undefined) settings.notifyMinutesAhead = body.notifyMinutesAhead;

    await settings.save();

    await createAuditLog({
      action: 'SETTINGS_UPDATE',
      module: 'Settings',
      description: 'Updated system settings',
      userId: user.userId,
      userRole: user.role,
      oldData,
      newData: settings.toObject(),
      request,
    });

    return NextResponse.json({ success: true, message: 'Settings updated successfully', data: settings });
  } catch (error) {
    console.error('System settings PUT error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
