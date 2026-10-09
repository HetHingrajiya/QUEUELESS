import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  return <Card><CardContent className="flex items-start gap-3 p-5"><div className="rounded-xl bg-blue-50 p-3 text-blue-600">{icon}</div><div className="min-w-0"><p className="text-sm text-slate-500">{title}</p><p className="mt-1 text-2xl font-bold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></div></CardContent></Card>;
}

function Breakdown({ rows, total, empty, columns = false }: { rows: { name: string; total?: number; completed?: number; noShow?: number; count?: number }[]; total?: number; empty: string; columns?: boolean }) {
  if (!rows.length) return <div className="flex h-32 items-center justify-center text-sm text-slate-500">{empty}</div>;
  const max = Math.max(1, ...rows.map((row) => row.total ?? row.count ?? 0));
  return <div className="space-y-4">{rows.map((row) => {
    const value = row.total ?? row.count ?? 0;
    return <div key={row.name} className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm"><span className="truncate font-medium text-slate-700">{row.name}</span><span className="shrink-0 text-slate-500">{value.toLocaleString()} tokens{total ? ` · ${((value / total) * 100).toFixed(1)}%` : ''}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-500" style={{ width: `${(value / max) * 100}%` }} /></div>
      {columns && <div className="flex gap-4 text-xs text-slate-500"><span>Completed: {row.completed ?? 0}</span><span>No-show: {row.noShow ?? 0}</span></div>}
    </div>;
  })}</div>;
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">System Analytics</h1><p className="text-sm text-slate-500">Platform-wide operational insights calculated from stored QueueLess records.</p></div>
        <Link href="/super-admin/reports" className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"><Download size={16} className="mr-2" /> Generate / View Reports</Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
        <Card><CardHeader><div className="flex items-center justify-between"><CardTitle>7-Day Token Trend</CardTitle><BarChart3 className="text-slate-400" size={20} /></div><p className="text-sm text-slate-500">Daily tokens created and completed, based on their stored timestamps.</p></CardHeader><CardContent>
          {data.days.every((item) => item.count === 0) ? <div className="flex h-56 items-center justify-center text-sm text-slate-500">No token activity in the last seven days.</div> : <div className="flex h-64 items-end gap-3 border-b border-slate-100 px-1 pt-4">{data.days.map((item) => <div key={item.key} title={`${item.label}: ${item.count} created, ${item.completed} completed`} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"><span className="text-xs text-slate-500">{item.count || ''}</span><div className="flex h-full w-full items-end justify-center gap-1"><div className="w-1/2 rounded-t bg-blue-500" style={{ height: item.count ? `${Math.max(4, item.count / data.maxDailyCount * 80)}%` : '0%' }} /><div className="w-1/2 rounded-t bg-emerald-500" style={{ height: item.completed ? `${Math.max(4, item.completed / data.maxDailyCount * 80)}%` : '0%' }} /></div><span className="text-[11px] text-slate-500">{item.label}</span></div>)}</div>}
          <div className="mt-4 flex gap-4 text-xs text-slate-500"><span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-blue-500" />Created</span><span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-emerald-500" />Completed</span></div>
        </CardContent></Card>

        <Card><CardHeader><div className="flex items-center justify-between"><CardTitle>Today’s Peak Hours</CardTitle><BarChart3 className="text-slate-400" size={20} /></div><p className="text-sm text-slate-500">Token creation counts grouped by the hour recorded in MongoDB.</p></CardHeader><CardContent>
          {data.hours.every((item) => item.count === 0) ? <div className="flex h-56 items-center justify-center text-sm text-slate-500">No token activity today.</div> : <div className="flex h-56 items-end gap-1 overflow-x-auto px-1 pt-3">{data.hours.map((item) => <div key={item.hour} title={`${item.label}: ${item.count} tokens`} className="flex h-full min-w-3 flex-1 flex-col items-center justify-end gap-1"><span className="text-[10px] text-slate-500">{item.count || ''}</span><div className="w-full rounded-t bg-indigo-500" style={{ height: item.count ? `${Math.max(4, item.count / data.maxHourlyCount * 75)}%` : '0%' }} />{item.hour % 3 === 0 ? <span className="whitespace-nowrap text-[10px] text-slate-500">{item.label}</span> : <span className="text-[10px] text-transparent">.</span>}</div>)}</div>}
        </CardContent></Card>

        <Card><CardHeader><div className="flex items-center justify-between"><CardTitle>Queue Status Breakdown</CardTitle><PieChartIcon className="text-slate-400" size={20} /></div><p className="text-sm text-slate-500">Current stored token statuses across the platform.</p></CardHeader><CardContent>
          {data.statusCounts.length === 0 ? <div className="flex h-32 items-center justify-center text-sm text-slate-500">No token status records available.</div> : <div className="space-y-4">{data.statusCounts.map((item) => <div key={item.name} className="space-y-1"><div className="flex justify-between gap-3 text-sm"><span className="font-medium text-slate-700">{item.name.replaceAll('_', ' ')}</span><span className="text-slate-500">{item.count.toLocaleString()} · {data.totalTokens ? ((item.count / data.totalTokens) * 100).toFixed(1) : '0.0'}%</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-teal-500" style={{ width: `${data.totalTokens ? item.count / data.totalTokens * 100 : 0}%` }} /></div></div>)}</div>}
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Service Distribution</CardTitle><p className="text-sm text-slate-500">Top services by total token volume.</p></CardHeader><CardContent><Breakdown rows={data.serviceCounts} total={data.totalTokens} empty="No service-linked token data available." /></CardContent></Card>

        <Card><CardHeader><CardTitle>Office Performance</CardTitle><p className="text-sm text-slate-500">Top offices by token volume, including completed and no-show counts.</p></CardHeader><CardContent><Breakdown rows={data.officeCounts} columns empty="No office-linked token data available." /></CardContent></Card>

        <Card><CardHeader><CardTitle>Organization Performance</CardTitle><p className="text-sm text-slate-500">Platform-wide token volume grouped by the office’s organization.</p></CardHeader><CardContent><Breakdown rows={data.orgCounts} columns empty="No organization-linked token data available." /></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle>Operational Notes</CardTitle><p className="text-sm text-slate-500">Interpretation and data-quality context.</p></CardHeader><CardContent className="grid grid-cols-1 gap-4 text-sm text-slate-600 md:grid-cols-3">
        <div className="rounded-lg bg-slate-50 p-4"><p className="font-semibold text-slate-800">Live queue snapshot</p><p className="mt-1">Waiting: {data.waitingCount.toLocaleString()} · In service/called: {data.servingCount.toLocaleString()} · Cancelled: {data.cancelledCount.toLocaleString()}</p></div>
        <div className="rounded-lg bg-slate-50 p-4"><p className="font-semibold text-slate-800">Service duration</p><p className="mt-1">{data.avgService === null ? 'No valid service duration has been recorded yet.' : `Average recorded service duration: ${data.avgService.toFixed(1)} minutes.`}</p></div>
        <div className="rounded-lg bg-slate-50 p-4"><p className="font-semibold text-slate-800">Data transparency</p><p className="mt-1">Charts use database records only. Missing timestamps or empty datasets are not replaced with sample values.</p></div>
      </CardContent></Card>
    </div>
  );
}
