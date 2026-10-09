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
    
    // Fetch offices for this organization
    const orgOffices = await Office.find({ organizationId: orgId }).select('_id').lean();
    const orgOfficeIds = orgOffices.map(o => o._id);
    
    // Time ranges
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Fetch all tokens for the last 7 days for most stats
    const recentTokens = await Token.find({
      officeId: { $in: orgOfficeIds },
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
      const calledAt = t.callTime || t.startTime;
      const queuedAt = t.checkInTime || t.createdAt;
      if (t.status === 'COMPLETED' && calledAt && queuedAt) {
        const waitMs = new Date(calledAt).getTime() - new Date(queuedAt).getTime();
        if (!Number.isFinite(waitMs) || waitMs < 0) return;
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

    // 2. Service Time Data: use recorded service duration only; never infer it from updatedAt.
    const serviceTimeMap = new Map<string, { totalTime: number, count: number }>();
    recentTokens.forEach(t => {
      if (t.status !== 'COMPLETED' || !t.serviceId) return;
      const serviceName = (t.serviceId as any).name;
      let serviceMs = 0;
      if (t.startTime && t.completionTime) {
        serviceMs = new Date(t.completionTime).getTime() - new Date(t.startTime).getTime();
      } else if (typeof t.processingTime === 'number' && t.processingTime > 0) {
        serviceMs = t.processingTime * 1000;
      }
      if (Number.isFinite(serviceMs) && serviceMs > 0 && serviceMs < 3600000) {
        if (!serviceTimeMap.has(serviceName)) serviceTimeMap.set(serviceName, { totalTime: 0, count: 0 });
        const d = serviceTimeMap.get(serviceName)!;
        d.totalTime += serviceMs;
        d.count += 1;
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

    // 5. Staff Performance Data – based on Token.staffId
    const staffMembers = await User.find({ organizationId: orgId, role: 'STAFF' });
    const staffTokenMap = new Map<string, { served: number; totalServiceMs: number }>();
    staffMembers.forEach(s => staffTokenMap.set(s._id.toString(), { served: 0, totalServiceMs: 0 }));

    recentTokens.forEach(t => {
      if (t.staffId && t.status === 'COMPLETED' && t.startTime && t.completionTime) {
        const key = t.staffId.toString();
        if (staffTokenMap.has(key)) {
          const d = staffTokenMap.get(key)!;
          d.served++;
          d.totalServiceMs += new Date(t.completionTime).getTime() - new Date(t.startTime).getTime();
        }
      }
    });

    const staffData = staffMembers.map(staff => {
      const d = staffTokenMap.get(staff._id.toString()) || { served: 0, totalServiceMs: 0 };
      return {
        name: staff.fullName,
        served: d.served,
        avgTime: d.served > 0 ? Math.round(d.totalServiceMs / d.served / 60000) : 0
      };
    }).sort((a, b) => b.served - a.served);

    const topPerformer = staffData.length > 0 ? staffData[0].name : 'N/A';
    let fastestTime = staffData.reduce((min, s) => s.avgTime > 0 && s.avgTime < min ? s.avgTime : min, 999);
    if (fastestTime === 999) fastestTime = 0;

    // 6. Office Performance Data – real token counts and real completion rate as efficiency
    const offices = await Office.find({ organizationId: orgId });
    const officeMap = new Map<string, { tokens: number; completed: number }>();
    offices.forEach(o => officeMap.set(o.name, { tokens: 0, completed: 0 }));

    recentTokens.forEach(t => {
      if (t.officeId && typeof t.officeId === 'object') {
        const oName = (t.officeId as any).name;
        if (officeMap.has(oName)) {
          officeMap.get(oName)!.tokens++;
          if (t.status === 'COMPLETED') officeMap.get(oName)!.completed++;
        }
      }
    });

    const officeData = Array.from(officeMap.entries()).map(([name, data]) => ({
      name,
      tokens: data.tokens,
      efficiency: data.tokens > 0 ? Math.round((data.completed / data.tokens) * 100) : 0
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
