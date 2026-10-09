import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import dbConnect from '@/lib/db';
import { Token, TokenStatus } from '@/models/Token';

// Always calculate analytics from the current database; never use illustrative chart values.
export const dynamic = 'force-dynamic';

async function getAnalyticsData() {
  await dbConnect();

  const [totalTokens, servedTokens, noShowTokens, completedTokens, hourlyCounts, serviceCounts] = await Promise.all([
    Token.countDocuments(),
    Token.countDocuments({ status: TokenStatus.COMPLETED }),
    Token.countDocuments({ status: TokenStatus.NO_SHOW }),
    Token.find({
      status: TokenStatus.COMPLETED,
      startTime: { $exists: true, $ne: null },
      completionTime: { $exists: true, $ne: null },
    }).select('createdAt checkInTime startTime completionTime').lean(),
    Token.aggregate([
      { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Token.aggregate([
      { $lookup: { from: 'services', localField: 'serviceId', foreignField: '_id', as: 'service', pipeline: [{ $project: { name: 1 } }] } },
      { $group: { _id: { $ifNull: [{ $arrayElemAt: ['$service.name', 0] }, 'Unassigned service'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
  ]);

  let totalWaitMs = 0;
  let totalServiceMs = 0;
  let waitCount = 0;
  let serviceCount = 0;
  for (const token of completedTokens) {
    const startedAt = new Date(token.startTime).getTime();
    const queuedAt = new Date(token.checkInTime || token.createdAt).getTime();
    const completedAt = new Date(token.completionTime).getTime();
    if (Number.isFinite(startedAt) && Number.isFinite(queuedAt) && startedAt >= queuedAt) {
      totalWaitMs += startedAt - queuedAt;
      waitCount++;
    }
    if (Number.isFinite(startedAt) && Number.isFinite(completedAt) && completedAt >= startedAt) {
      totalServiceMs += completedAt - startedAt;
      serviceCount++;
    }
  }

  const hours = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`,
    count: hourlyCounts.find((item: { _id: number }) => item._id === hour)?.count ?? 0,
  }));
  const maxHourlyCount = Math.max(1, ...hours.map((item) => item.count));

  return {
    totalTokens,
    servedTokens,
    noShowRate: totalTokens ? ((noShowTokens / totalTokens) * 100).toFixed(1) : '0.0',
    avgWaitTimeMins: waitCount ? (totalWaitMs / waitCount / 60000).toFixed(1) : null,
    avgServiceTimeMins: serviceCount ? (totalServiceMs / serviceCount / 60000).toFixed(1) : null,
    hours,
    maxHourlyCount,
    serviceCounts: serviceCounts.map((item: { _id: string; count: number }) => ({ name: item._id, count: item.count })),
  };
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">System Analytics</h2>
          <p className="text-sm text-slate-500">Metrics and distributions calculated from live QueueLess token records.</p>
        </div>
        <Link href="/super-admin/reports" className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"><Download size={16} className="mr-2" /> Generate / View Reports</Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Avg. Wait Time</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-slate-900">{data.avgWaitTimeMins === null ? '—' : `${data.avgWaitTimeMins} min`}</div><p className="mt-1 text-xs text-slate-400">{data.avgWaitTimeMins === null ? 'No valid wait-time records yet' : 'Calculated from completed tokens with timestamps'}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Avg. Service Time</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-slate-900">{data.avgServiceTimeMins === null ? '—' : `${data.avgServiceTimeMins} min`}</div><p className="mt-1 text-xs text-slate-400">{data.avgServiceTimeMins === null ? 'No valid service-time records yet' : 'Calculated from completed tokens with timestamps'}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Total Tokens Served</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-slate-900">{data.servedTokens.toLocaleString()}</div><p className="mt-1 text-xs text-slate-400">Out of {data.totalTokens.toLocaleString()} total generated</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">No-show Rate</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-slate-900">{data.noShowRate}%</div><p className="mt-1 text-xs text-slate-400">No-show tokens / all tokens</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><div className="flex items-center justify-between"><CardTitle>Peak Hours Analysis</CardTitle><BarChart3 className="text-slate-400" size={20} /></div><p className="text-sm text-slate-500">Token creation counts by hour of day, based on database records.</p></CardHeader>
          <CardContent className="border-t border-slate-100 pt-5">
            {data.totalTokens === 0 ? <div className="flex h-56 items-center justify-center text-sm text-slate-500">No token data available for peak-hour analysis.</div> : <div className="flex h-60 items-end gap-1 overflow-x-auto px-1">
              {data.hours.map((item) => <div key={item.hour} title={`${item.label}: ${item.count} tokens`} className="flex h-full min-w-3 flex-1 flex-col items-center justify-end gap-2">
                <span className="text-[10px] text-slate-500">{item.count || ''}</span>
                <div className="w-full rounded-t bg-blue-500" style={{ height: `${Math.max(item.count ? 5 : 0, item.count / data.maxHourlyCount * 78)}%` }} />
                {item.hour % 3 === 0 ? <span className="whitespace-nowrap text-[10px] text-slate-500">{item.label}</span> : <span className="text-[10px] text-transparent">.</span>}
              </div>)}
            </div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><div className="flex items-center justify-between"><CardTitle>Service Distribution</CardTitle><PieChartIcon className="text-slate-400" size={20} /></div><p className="text-sm text-slate-500">Token volume grouped by service from stored token records.</p></CardHeader>
          <CardContent className="space-y-5 border-t border-slate-100 pt-5">
            {data.serviceCounts.length === 0 ? <div className="flex h-56 items-center justify-center text-sm text-slate-500">No service/token data available for distribution.</div> : data.serviceCounts.map((item) => <div key={item.name} className="space-y-2">
              <div className="flex items-center justify-between gap-4 text-sm"><span className="truncate font-medium text-slate-700">{item.name}</span><span className="shrink-0 text-slate-500">{item.count.toLocaleString()} tokens · {data.totalTokens ? ((item.count / data.totalTokens) * 100).toFixed(1) : '0.0'}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-500" style={{ width: `${data.totalTokens ? (item.count / data.totalTokens) * 100 : 0}%` }} /></div>
            </div>)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
