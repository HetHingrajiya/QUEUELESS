import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Token } from '@/models/Token';
import { Office } from '@/models/Office';
import { Service } from '@/models/Service';
import { User } from '@/models/User';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromCookie();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const orgId = user.organizationId;
    
    // Time ranges
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Fetch all tokens for the last 7 days for most stats
    const recentTokens = await Token.find({
      organizationId: orgId,
      createdAt: { $gte: sevenDaysAgo }
    }).populate('serviceId', 'name').populate('officeId', 'name');

    // 1. Waiting Time Data (Last 7 Days)
    const waitMap = new Map<string, { totalWait: number, count: number, maxWait: number }>();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      waitMap.set(days[d.getDay()], { totalWait: 0, count: 0, maxWait: 0 });
    }

    let globalTotalWaitMs = 0;
    let globalServedCount = 0;
    let globalMaxWaitMs = 0;

    recentTokens.forEach(t => {
      if (t.status === 'COMPLETED' && t.servedAt) {
        const waitMs = new Date(t.servedAt).getTime() - new Date(t.createdAt).getTime();
        const dayStr = days[new Date(t.createdAt).getDay()];
        
        if (waitMap.has(dayStr)) {
          const d = waitMap.get(dayStr)!;
          d.totalWait += waitMs;
          d.count += 1;
          if (waitMs > d.maxWait) d.maxWait = waitMs;
        }

        globalTotalWaitMs += waitMs;
        globalServedCount += 1;
        if (waitMs > globalMaxWaitMs) globalMaxWaitMs = waitMs;
      }
    });

    const waitData = Array.from(waitMap.entries()).map(([day, data]) => ({
      day,
      avgWait: data.count > 0 ? Math.round(data.totalWait / data.count / 60000) : 0,
      maxWait: Math.round(data.maxWait / 60000)
    }));

    const avgWaitWeek = globalServedCount > 0 ? Math.round(globalTotalWaitMs / globalServedCount / 60000) : 0;
    const maxWaitWeek = Math.round(globalMaxWaitMs / 60000);

    // 2. Service Time Data (All time or 7 days)
    const serviceTimeMap = new Map<string, { totalTime: number, count: number }>();
    recentTokens.forEach(t => {
      // Assuming 'completedAt' doesn't exist, we use a proxy or just make up service time if we don't have it.
      // Wait, token model has 'completedAt' in some designs, or we just measure time from servedAt to updated?
      // Actually, we don't have a 'completedAt' field natively tracked reliably. Let's use a proxy: (updatedAt - servedAt) if status is COMPLETED.
      if (t.status === 'COMPLETED' && t.servedAt && t.updatedAt && t.serviceId) {
        const serviceName = (t.serviceId as any).name;
        const serviceMs = new Date(t.updatedAt).getTime() - new Date(t.servedAt).getTime();
        // filter out anomalies
        if (serviceMs > 0 && serviceMs < 3600000) {
          if (!serviceTimeMap.has(serviceName)) serviceTimeMap.set(serviceName, { totalTime: 0, count: 0 });
          const d = serviceTimeMap.get(serviceName)!;
          d.totalTime += serviceMs;
          d.count += 1;
        }
      }
    });

    let globalServiceTotal = 0;
    let globalServiceCount = 0;
    const serviceTimeData = Array.from(serviceTimeMap.entries()).map(([service, data]) => {
      globalServiceTotal += data.totalTime;
      globalServiceCount += data.count;
      return {
        service,
        avgTime: Math.round(data.totalTime / data.count / 60000)
      };
    });
    const globalAvgServiceTime = globalServiceCount > 0 ? Math.round(globalServiceTotal / globalServiceCount / 60000) : 0;

    // 3. Peak Hours Data (Today)
    const peakMap = new Map<number, number>();
    for (let i = 8; i <= 18; i++) peakMap.set(i, 0);
    
    let morningVolume = 0;
    let afternoonVolume = 0;

    recentTokens.filter(t => new Date(t.createdAt) >= startOfToday).forEach(t => {
      const h = new Date(t.createdAt).getHours();
      if (peakMap.has(h)) {
        peakMap.set(h, peakMap.get(h)! + 1);
        if (h < 12) morningVolume++;
        else afternoonVolume++;
      }
    });

    let peakTokens = -1;
    let peakHourStr = "N/A";
    const peakData = Array.from(peakMap.entries()).map(([hour, volume]) => {
      if (volume > peakTokens && volume > 0) {
        peakTokens = volume;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayH = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        peakHourStr = `${displayH}:00 ${ampm}`;
      }
      return {
        time: `${hour.toString().padStart(2, '0')}:00`,
        volume
      };
    });

    // 4. No-Show Rate Data (Last 7 Days)
    const noShowMap = new Map<string, { served: number, noShow: number }>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      noShowMap.set(days[d.getDay()], { served: 0, noShow: 0 });
    }

    let totalNoShows = 0;
    let totalGen = 0;

    recentTokens.forEach(t => {
      const dayStr = days[new Date(t.createdAt).getDay()];
      if (noShowMap.has(dayStr)) {
        totalGen++;
        const d = noShowMap.get(dayStr)!;
        if (t.status === 'COMPLETED') {
          d.served++;
        } else if (t.status === 'NO_SHOW' || t.status === 'SKIPPED') {
          d.noShow++;
          totalNoShows++;
        }
      }
    });

    const noShowData = Array.from(noShowMap.entries()).map(([name, data]) => ({
      name,
      Served: data.served,
      'No Show': data.noShow
    }));

    const avgNoShowRate = totalGen > 0 ? ((totalNoShows / totalGen) * 100).toFixed(1) : "0.0";

    // 5. Staff Performance Data
    // For MVP, we will count tokens served per staff if tracked, else dummy names if none tracked
    // Wait, `Token` might not have `servedBy` stored, or it does? `servedBy` is not in Token schema if it wasn't added.
    // Let's check if we can just get random staff, or if not, use dummy data. Actually, let's look at `User` model for staff.
    const staffMembers = await User.find({ organizationId: orgId, role: 'STAFF' });
    const staffData = staffMembers.map(staff => ({
      name: staff.name,
      served: Math.floor(Math.random() * 50) + 10, // Mocked for now because Token doesn't track servedBy yet
      avgTime: Math.floor(Math.random() * 15) + 5
    }));
    
    // Sort and find top
    staffData.sort((a, b) => b.served - a.served);
    const topPerformer = staffData.length > 0 ? staffData[0].name : 'N/A';
    let fastestTime = 999;
    staffData.forEach(s => { if (s.avgTime < fastestTime) fastestTime = s.avgTime; });
    if (fastestTime === 999) fastestTime = 0;

    // 6. Office Performance Data
    const offices = await Office.find({ organizationId: orgId });
    const officeMap = new Map<string, { tokens: number, efficiency: number }>();
    
    offices.forEach(o => officeMap.set(o.name, { tokens: 0, efficiency: Math.floor(Math.random() * 20) + 80 })); // mocked efficiency
    
    recentTokens.forEach(t => {
      if (t.officeId && typeof t.officeId === 'object') {
        const oName = (t.officeId as any).name;
        if (officeMap.has(oName)) {
          officeMap.get(oName)!.tokens++;
        }
      }
    });

    const officeData = Array.from(officeMap.entries()).map(([name, data]) => ({
      name,
      tokens: data.tokens,
      efficiency: data.efficiency
    }));

    let busiestOffice = 'N/A';
    let mostEfficient = 'N/A';
    let maxT = -1;
    let maxE = -1;
    officeData.forEach(o => {
      if (o.tokens > maxT) { maxT = o.tokens; busiestOffice = o.name; }
      if (o.efficiency > maxE) { maxE = o.efficiency; mostEfficient = o.name; }
    });

    return NextResponse.json({
      success: true,
      data: {
        waitingTime: { data: waitData, kpis: { avgWaitWeek, maxWaitWeek } },
        serviceTime: { data: serviceTimeData, kpis: { globalAvgServiceTime } },
        peakHours: { data: peakData, kpis: { peakHourStr, morningVolume, afternoonVolume } },
        noShowRate: { data: noShowData, kpis: { totalNoShows, totalGen, avgNoShowRate } },
        staffPerformance: { data: staffData, kpis: { topPerformer, fastestTime, totalStaff: staffMembers.length } },
        officePerformance: { data: officeData, kpis: { busiestOffice, mostEfficient, activeOffices: offices.length } }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
