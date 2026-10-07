import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Token } from '@/models/Token';
import { getUserFromCookie } from '@/lib/auth';
import { Service } from '@/models/Service';
import { Office } from '@/models/Office';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const orgId = user.organizationId;
    
    // Fetch offices for this organization
    const orgOffices = await Office.find({ organizationId: orgId }).select('_id').lean();
    const orgOfficeIds = orgOffices.map(o => o._id);
    
    // Today's date range
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Total Tokens Today
    const totalTokensToday = await Token.countDocuments({
      officeId: { $in: orgOfficeIds },
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    // 2. Tokens Served Today
    const tokensServedToday = await Token.countDocuments({
      officeId: { $in: orgOfficeIds },
      status: 'COMPLETED',
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    // 3. Avg Wait Time Today (COMPLETED tokens)
    const servedTokens = await Token.find({
      officeId: { $in: orgOfficeIds },
      status: 'COMPLETED',
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      servedAt: { $exists: true }
    });
    
    let totalWaitTimeMs = 0;
    servedTokens.forEach(t => {
      if (t.servedAt && t.createdAt) {
        totalWaitTimeMs += (new Date(t.servedAt).getTime() - new Date(t.createdAt).getTime());
      }
    });
    const avgWaitMinutes = servedTokens.length > 0 ? Math.round(totalWaitTimeMs / servedTokens.length / 60000) : 0;
    
    // 4. Hourly Data for Today
    const todayTokens = await Token.find({
      officeId: { $in: orgOfficeIds },
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const hourlyMap = new Map<number, { tokens: number, totalWait: number, servedCount: number }>();
    for (let i = 8; i <= 18; i++) {
      hourlyMap.set(i, { tokens: 0, totalWait: 0, servedCount: 0 });
    }

    todayTokens.forEach(t => {
      const hour = new Date(t.createdAt).getHours();
      if (hourlyMap.has(hour)) {
        const hData = hourlyMap.get(hour)!;
        hData.tokens += 1;
        
        if (t.status === 'COMPLETED' && t.servedAt) {
          const waitMs = new Date(t.servedAt).getTime() - new Date(t.createdAt).getTime();
          hData.totalWait += waitMs;
          hData.servedCount += 1;
        }
      }
    });

    const hourlyData = Array.from(hourlyMap.entries()).map(([hour, data]) => {
      const formattedHour = `${hour.toString().padStart(2, '0')}:00`;
      const avgWait = data.servedCount > 0 ? Math.round(data.totalWait / data.servedCount / 60000) : 0;
      return {
        time: formattedHour,
        tokens: data.tokens,
        waitTime: avgWait
      };
    });

    // Determine Peak Load Time
    let maxTokens = -1;
    let peakHour = "N/A";
    hourlyData.forEach(h => {
      if (h.tokens > maxTokens && h.tokens > 0) {
        maxTokens = h.tokens;
        // Convert "14:00" to "2:00 PM"
        const hourInt = parseInt(h.time.split(':')[0]);
        const ampm = hourInt >= 12 ? 'PM' : 'AM';
        const displayHour = hourInt > 12 ? hourInt - 12 : (hourInt === 0 ? 12 : hourInt);
        peakHour = `${displayHour}:00 ${ampm}`;
      }
    });

    // 5. Service Distribution (All time or today, let's do all time for more data)
    const allTokens = await Token.find({ officeId: { $in: orgOfficeIds } }).populate('serviceId', 'name');
    const serviceMap = new Map<string, number>();
    
    allTokens.forEach(t => {
      if (t.serviceId && typeof t.serviceId === 'object') {
        const sName = (t.serviceId as any).name;
        serviceMap.set(sName, (serviceMap.get(sName) || 0) + 1);
      }
    });

    const serviceData = Array.from(serviceMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalTokensToday,
          tokensServedToday,
          avgWaitMinutes,
          peakHour
        },
        hourlyData,
        serviceData
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
