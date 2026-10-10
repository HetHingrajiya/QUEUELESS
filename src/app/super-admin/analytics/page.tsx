import Link from 'next/link';
import { Download, BarChart3, PieChart as PieChartIcon, Building2, Activity, Users, Clock, Ticket, AlertTriangle, ServerCog } from 'lucide-react';
import dbConnect from '@/lib/db';
import { Token, TokenStatus } from '@/models/Token';
import { Organization } from '@/models/Organization';
import { Office } from '@/models/Office';
import { Counter, CounterStatus } from '@/models/Counter';
import { User, UserRole } from '@/models/User';

export const dynamic = 'force-dynamic';

async function getAnalyticsData() {
  await dbConnect();
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const tomorrow = new Date(startOfToday);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 6);

  const [
    totalTokens, completedCount, noShowCount, waitingCount, servingCount, cancelledCount,
    organizations, offices, activeOffices, activeCounters, totalStaff, totalAdmins,
    completedDocs, hourlyCounts, serviceCounts, dailyCounts, statusCounts, officeCounts, orgCounts,
  ] = await Promise.all([
    Token.countDocuments(),
    Token.countDocuments({ status: TokenStatus.COMPLETED }),
    Token.countDocuments({ status: TokenStatus.NO_SHOW }),
    Token.countDocuments({ status: TokenStatus.WAITING }),
    Token.countDocuments({ status: { $in: [TokenStatus.CALLED, TokenStatus.CHECKED_IN, TokenStatus.SERVING] } }),
    Token.countDocuments({ status: TokenStatus.CANCELLED }),
    Organization.countDocuments(),
    Office.countDocuments(),
    Office.countDocuments({ status: 'ACTIVE' }),
    Counter.countDocuments({ status: CounterStatus.ACTIVE }),
    User.countDocuments({ role: UserRole.STAFF, status: 'ACTIVE' }),
    User.countDocuments({ role: UserRole.ADMIN, status: 'ACTIVE' }),
    Token.find({
      status: TokenStatus.COMPLETED,
      $or: [
        { startTime: { $exists: true, $ne: null } },
        { callTime: { $exists: true, $ne: null } },
      ],
      $and: [{ $or: [{ completionTime: { $exists: true, $ne: null } }, { processingTime: { $gt: 0 } }] }],
    }).select('createdAt checkInTime callTime startTime completionTime processingTime').lean(),
    Token.aggregate([
      { $match: { createdAt: { $gte: startOfToday, $lt: tomorrow } } },
      { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Token.aggregate([
      { $lookup: { from: 'services', localField: 'serviceId', foreignField: '_id', as: 'service' } },
      { $group: { _id: { $ifNull: [{ $arrayElemAt: ['$service.name', 0] }, 'Unassigned service'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    Token.aggregate([
      { $match: { createdAt: { $gte: startOfWeek, $lt: tomorrow } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', TokenStatus.COMPLETED] }, 1, 0] } } } },
      { $sort: { _id: 1 } },
    ]),
    Token.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Token.aggregate([
      { $lookup: { from: 'offices', localField: 'officeId', foreignField: '_id', as: 'office' } },
      { $group: { _id: { $ifNull: [{ $arrayElemAt: ['$office.name', 0] }, 'Unassigned office'] }, total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', TokenStatus.COMPLETED] }, 1, 0] } }, noShow: { $sum: { $cond: [{ $eq: ['$status', TokenStatus.NO_SHOW] }, 1, 0] } } } },
      { $sort: { total: -1 } },
      { $limit: 8 },
    ]),
    Token.aggregate([
      { $lookup: { from: 'offices', localField: 'officeId', foreignField: '_id', as: 'office' } },
      { $lookup: { from: 'organizations', localField: 'office.organizationId', foreignField: '_id', as: 'organization' } },
      { $group: { _id: { $ifNull: [{ $arrayElemAt: ['$organization.name', 0] }, 'Unassigned organization'] }, total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', TokenStatus.COMPLETED] }, 1, 0] } }, noShow: { $sum: { $cond: [{ $eq: ['$status', TokenStatus.NO_SHOW] }, 1, 0] } } } },
      { $sort: { total: -1 } },
      { $limit: 8 },
    ]),
  ]);

  let waitMs = 0, waitSamples = 0, serviceMs = 0, serviceSamples = 0;
  for (const token of completedDocs) {
    const queuedAt = new Date(token.checkInTime || token.createdAt).getTime();
    const calledAt = token.callTime ? new Date(token.callTime).getTime() : token.startTime ? new Date(token.startTime).getTime() : NaN;
    const startedAt = token.startTime ? new Date(token.startTime).getTime() : calledAt;
    const completedAt = token.completionTime ? new Date(token.completionTime).getTime() : NaN;
    if (Number.isFinite(queuedAt) && Number.isFinite(calledAt) && calledAt >= queuedAt) { waitMs += calledAt - queuedAt; waitSamples++; }
    let duration = Number.isFinite(startedAt) && Number.isFinite(completedAt) ? completedAt - startedAt : 0;
    if (!(duration > 0) && typeof token.processingTime === 'number') duration = token.processingTime * 1000;
    if (Number.isFinite(duration) && duration > 0 && duration < 3600000) { serviceMs += duration; serviceSamples++; }
  }

  const hours = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`,
    count: hourlyCounts.find((item: { _id: number }) => item._id === hour)?.count ?? 0,
  }));
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const item = dailyCounts.find((entry: { _id: string }) => entry._id === key);
    return { key, label: date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }), count: item?.count ?? 0, completed: item?.completed ?? 0 };
  });
  return {
    totalTokens, completedCount, noShowCount, waitingCount, servingCount, cancelledCount,
    organizations, offices, activeOffices, activeCounters, totalStaff, totalAdmins,
    noShowRate: totalTokens ? (noShowCount / totalTokens) * 100 : 0,
    completionRate: totalTokens ? (completedCount / totalTokens) * 100 : 0,
    avgWait: waitSamples ? waitMs / waitSamples / 60000 : null,
    avgService: serviceSamples ? serviceMs / serviceSamples / 60000 : null,
    hours, days,
    maxHourlyCount: Math.max(1, ...hours.map((item) => item.count)),
    maxDailyCount: Math.max(1, ...days.map((item) => item.count)),
    serviceCounts: serviceCounts.map((item: { _id: string; count: number }) => ({ name: item._id, count: item.count })),
    statusCounts: statusCounts.map((item: { _id: string; count: number }) => ({ name: item._id || 'Unknown', count: item.count })),
    officeCounts: officeCounts.map((item: { _id: string; total: number; completed: number; noShow: number }) => ({ name: item._id, total: item.total, completed: item.completed, noShow: item.noShow })),
    orgCounts: orgCounts.map((item: { _id: string; total: number; completed: number; noShow: number }) => ({ name: item._id, total: item.total, completed: item.completed, noShow: item.noShow })),
  };
}

function Metric({ title, value, note, icon }: { title: string; value: string | number; note: string; icon: React.ReactNode }) {
  return (
    <div className="bg-background shadow-neu rounded-[2rem] p-6 flex items-start gap-4 h-full border-0">
      <div className="w-12 h-12 rounded-xl bg-background shadow-neu-inset flex items-center justify-center text-primary shrink-0">
         {icon}
      </div>
      <div className="min-w-0 flex-1">
         <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</p>
         <p className="mt-1 text-2xl font-black text-foreground truncate">{value}</p>
         <p className="mt-1 text-[11px] font-bold text-slate-400 truncate">{note}</p>
      </div>
    </div>
  );
}

function Breakdown({ rows, total, empty, columns = false }: { rows: { name: string; total?: number; completed?: number; noShow?: number; count?: number }[]; total?: number; empty: string; columns?: boolean }) {
  if (!rows.length) return <div className="flex h-32 items-center justify-center text-xs font-bold text-slate-500 bg-background shadow-neu-inset rounded-2xl">{empty}</div>;
  const max = Math.max(1, ...rows.map((row) => row.total ?? row.count ?? 0));
  return (
    <div className="space-y-6">
      {rows.map((row) => {
         const value = row.total ?? row.count ?? 0;
         return (
            <div key={row.name} className="space-y-2">
               <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-bold text-foreground text-xs">{row.name}</span>
                  <span className="shrink-0 text-xs font-black text-slate-500">{value.toLocaleString()} tokens{total ? ` · ${((value / total) * 100).toFixed(1)}%` : ''}</span>
               </div>
               <div className="h-3 overflow-hidden rounded-full bg-background shadow-neu-inset p-0.5">
                  <div className="h-full rounded-full bg-primary shadow-sm transition-all" style={{ width: `${(value / max) * 100}%` }} />
               </div>
               {columns && (
                  <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                     <span className="text-emerald-500">Completed: {row.completed ?? 0}</span>
                     <span className="text-red-400">No-show: {row.noShow ?? 0}</span>
                  </div>
               )}
            </div>
         );
      })}
    </div>
  );
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();
  return (
    <div className="space-y-6 lg:space-y-8 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">System Analytics</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold mt-1">Platform-wide operational insights.</p>
        </div>
        
        <Link href="/super-admin/reports">
          <button className="h-12 px-6 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl text-xs uppercase font-black tracking-widest text-primary flex items-center justify-center transition-all border-0">
            <Download size={16} className="mr-2" /> GENERATE REPORTS
          </button>
        </Link>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 space-y-6 lg:space-y-8">
         <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <Metric title="Total Tokens" value={data.totalTokens.toLocaleString()} note="All stored token records" icon={<Ticket size={20} />} />
            <Metric title="Completion Rate" value={`${data.completionRate.toFixed(1)}%`} note={`${data.completedCount.toLocaleString()} completed`} icon={<Activity size={20} />} />
            <Metric title="Average Wait" value={data.avgWait === null ? '—' : `${data.avgWait.toFixed(1)} min`} note="Only valid recorded timestamps" icon={<Clock size={20} />} />
            <Metric title="No-show Rate" value={`${data.noShowRate.toFixed(1)}%`} note={`${data.noShowCount.toLocaleString()} no-show tokens`} icon={<AlertTriangle size={20} />} />
            <Metric title="Organizations" value={data.organizations.toLocaleString()} note="Registered organizations" icon={<Building2 size={20} />} />
            <Metric title="Active Offices" value={`${data.activeOffices} / ${data.offices}`} note="Active vs total offices" icon={<Building2 size={20} />} />
            <Metric title="Active Counters" value={data.activeCounters.toLocaleString()} note="Counters currently marked active" icon={<ServerCog size={20} />} />
            <Metric title="Active Workforce" value={(data.totalAdmins + data.totalStaff).toLocaleString()} note={`${data.totalAdmins} admins · ${data.totalStaff} staff`} icon={<Users size={20} />} />
         </div>

         <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0 flex flex-col h-full">
               <div className="flex items-center justify-between mb-8">
                  <div>
                     <h2 className="text-lg font-black text-foreground">7-Day Token Trend</h2>
                     <p className="text-xs font-bold text-muted-foreground mt-1">Daily tokens created and completed</p>
                  </div>
                  <BarChart3 className="text-slate-300 shrink-0" size={24} />
               </div>
               
               {data.days.every((item) => item.count === 0) ? (
                  <div className="flex flex-1 items-center justify-center text-xs font-bold text-slate-500 bg-background shadow-neu-inset rounded-[1.5rem] min-h-[200px]">
                     No token activity in the last seven days.
                  </div>
               ) : (
                  <div className="flex-1 bg-background shadow-neu-inset rounded-[1.5rem] p-6 flex flex-col justify-end">
                     <div className="flex h-48 items-end gap-2 md:gap-4 border-b-2 border-primary/5 pb-2">
                        {data.days.map((item) => (
                           <div key={item.key} title={`${item.label}: ${item.count} created, ${item.completed} completed`} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2 group">
                              <span className="text-[10px] font-black text-slate-400 group-hover:text-primary transition-colors">{item.count || ''}</span>
                              <div className="flex h-full w-full items-end justify-center gap-0.5 md:gap-1">
                                 <div className="w-1/2 rounded-t-md bg-blue-400 transition-all group-hover:bg-blue-500" style={{ height: item.count ? `${Math.max(4, item.count / data.maxDailyCount * 85)}%` : '0%' }} />
                                 <div className="w-1/2 rounded-t-md bg-emerald-400 transition-all group-hover:bg-emerald-500" style={{ height: item.completed ? `${Math.max(4, item.completed / data.maxDailyCount * 85)}%` : '0%' }} />
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-foreground transition-colors">{item.label}</span>
                           </div>
                        ))}
                     </div>
                     <div className="mt-6 flex justify-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span className="flex items-center"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-blue-500" />Created</span>
                        <span className="flex items-center"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500" />Completed</span>
                     </div>
                  </div>
               )}
            </div>

            <div className="bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0 flex flex-col h-full">
               <div className="flex items-center justify-between mb-8">
                  <div>
                     <h2 className="text-lg font-black text-foreground">Today's Peak Hours</h2>
                     <p className="text-xs font-bold text-muted-foreground mt-1">Token creation counts grouped by hour</p>
                  </div>
                  <BarChart3 className="text-slate-300 shrink-0" size={24} />
               </div>
               
               {data.hours.every((item) => item.count === 0) ? (
                  <div className="flex flex-1 items-center justify-center text-xs font-bold text-slate-500 bg-background shadow-neu-inset rounded-[1.5rem] min-h-[200px]">
                     No token activity today.
                  </div>
               ) : (
                  <div className="flex-1 bg-background shadow-neu-inset rounded-[1.5rem] p-4 flex flex-col justify-end overflow-x-auto custom-scrollbar">
                     <div className="flex h-48 items-end gap-1 min-w-[500px] border-b-2 border-primary/5 pb-2">
                        {data.hours.map((item) => (
                           <div key={item.hour} title={`${item.label}: ${item.count} tokens`} className="flex h-full min-w-3 flex-1 flex-col items-center justify-end gap-1 group">
                              <span className="text-[9px] font-black text-slate-300 group-hover:text-primary transition-colors">{item.count || ''}</span>
                              <div className="w-full rounded-t-sm bg-indigo-300 transition-all group-hover:bg-indigo-500" style={{ height: item.count ? `${Math.max(4, item.count / data.maxHourlyCount * 85)}%` : '0%' }} />
                              {item.hour % 3 === 0 ? <span className="whitespace-nowrap text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-foreground">{item.label}</span> : <span className="text-[9px] text-transparent leading-none">.</span>}
                           </div>
                        ))}
                     </div>
                  </div>
               )}
            </div>

            <div className="bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0">
               <div className="flex items-center justify-between mb-8">
                  <div>
                     <h2 className="text-lg font-black text-foreground">Queue Status Breakdown</h2>
                     <p className="text-xs font-bold text-muted-foreground mt-1">Current stored token statuses</p>
                  </div>
                  <PieChartIcon className="text-slate-300 shrink-0" size={24} />
               </div>
               
               {data.statusCounts.length === 0 ? (
                  <div className="flex h-32 items-center justify-center text-xs font-bold text-slate-500 bg-background shadow-neu-inset rounded-[1.5rem]">
                     No token status records available.
                  </div>
               ) : (
                  <div className="space-y-6">
                     {data.statusCounts.map((item) => (
                        <div key={item.name} className="space-y-2">
                           <div className="flex justify-between gap-3 text-sm">
                              <span className="font-bold text-foreground text-xs uppercase tracking-wider">{item.name.replaceAll('_', ' ')}</span>
                              <span className="text-xs font-black text-slate-500">{item.count.toLocaleString()} · {data.totalTokens ? ((item.count / data.totalTokens) * 100).toFixed(1) : '0.0'}%</span>
                           </div>
                           <div className="h-3 rounded-full bg-background shadow-neu-inset p-0.5">
                              <div className="h-full rounded-full bg-teal-400 transition-all" style={{ width: `${data.totalTokens ? item.count / data.totalTokens * 100 : 0}%` }} />
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>

            <div className="bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0">
               <h2 className="text-lg font-black text-foreground mb-1">Service Distribution</h2>
               <p className="text-xs font-bold text-muted-foreground mb-8">Top services by total volume</p>
               <Breakdown rows={data.serviceCounts} total={data.totalTokens} empty="No service-linked token data available." />
            </div>

            <div className="bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0">
               <h2 className="text-lg font-black text-foreground mb-1">Office Performance</h2>
               <p className="text-xs font-bold text-muted-foreground mb-8">Top offices by token volume</p>
               <Breakdown rows={data.officeCounts} columns empty="No office-linked token data available." />
            </div>

            <div className="bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0">
               <h2 className="text-lg font-black text-foreground mb-1">Organization Performance</h2>
               <p className="text-xs font-bold text-muted-foreground mb-8">Platform-wide volume grouped by organization</p>
               <Breakdown rows={data.orgCounts} columns empty="No organization-linked token data available." />
            </div>
         </div>

         <div className="bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0">
            <h2 className="text-lg font-black text-foreground mb-6">Operational Notes</h2>
            <div className="grid grid-cols-1 gap-6 text-sm text-foreground md:grid-cols-3">
               <div className="rounded-[1.5rem] bg-background shadow-neu-inset p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Live queue snapshot</p>
                  <p className="font-bold text-slate-500">Waiting: <span className="text-foreground">{data.waitingCount.toLocaleString()}</span> · In service/called: <span className="text-foreground">{data.servingCount.toLocaleString()}</span> · Cancelled: <span className="text-foreground">{data.cancelledCount.toLocaleString()}</span></p>
               </div>
               <div className="rounded-[1.5rem] bg-background shadow-neu-inset p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Service duration</p>
                  <p className="font-bold text-slate-500">{data.avgService === null ? 'No valid service duration has been recorded yet.' : `Average recorded service duration: `}<span className="text-foreground">{data.avgService !== null && data.avgService.toFixed(1)}</span> {data.avgService !== null && 'minutes'}</p>
               </div>
               <div className="rounded-[1.5rem] bg-background shadow-neu-inset p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Data transparency</p>
                  <p className="font-bold text-slate-500">Charts use database records only. Missing timestamps or empty datasets are not replaced with sample values.</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
