import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Brain, Clock, Database, Timer, AlertTriangle } from 'lucide-react';
import dbConnect from '@/lib/db';
import { Token, TokenStatus } from '@/models/Token';

export const dynamic = 'force-dynamic';

async function getAiAnalytics() {
  await dbConnect();
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfSevenDays = new Date(startOfToday);
  startOfSevenDays.setDate(startOfSevenDays.getDate() - 6);
  const tomorrow = new Date(startOfToday);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayTotal, todayCompleted, completedWithTimes, hourlyCounts, serviceCounts] = await Promise.all([
    Token.countDocuments({ createdAt: { $gte: startOfToday, $lt: tomorrow } }),
    Token.countDocuments({ createdAt: { $gte: startOfToday, $lt: tomorrow }, status: TokenStatus.COMPLETED }),
    Token.find({
      createdAt: { $gte: startOfSevenDays, $lt: tomorrow },
      status: TokenStatus.COMPLETED,
    }).select('createdAt checkInTime callTime startTime completionTime processingTime').lean(),
    Token.aggregate([
      { $match: { createdAt: { $gte: startOfToday, $lt: tomorrow } } },
      { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Token.aggregate([
      { $match: { createdAt: { $gte: startOfSevenDays, $lt: tomorrow } } },
      { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  let totalWaitMs = 0;
  let waitCount = 0;
  let totalServiceMs = 0;
  let serviceCount = 0;
  for (const token of completedWithTimes) {
    const queuedAt = token.checkInTime ? new Date(token.checkInTime).getTime() : new Date(token.createdAt).getTime();
    const calledAt = token.callTime ? new Date(token.callTime).getTime() : token.startTime ? new Date(token.startTime).getTime() : NaN;
    const startedAt = token.startTime ? new Date(token.startTime).getTime() : calledAt;
    const completedAt = token.completionTime ? new Date(token.completionTime).getTime() : NaN;
    if (Number.isFinite(queuedAt) && Number.isFinite(calledAt) && calledAt >= queuedAt) {
      totalWaitMs += calledAt - queuedAt;
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
  const busiestHour = serviceCounts[0]?._id;
  return {
    todayTotal,
    todayCompleted,
    avgWaitMinutes: waitCount ? Math.round(totalWaitMs / waitCount / 60000) : null,
    avgServiceMinutes: serviceCount ? Math.round(totalServiceMs / serviceCount / 60000) : null,
    hours,
    maxHourlyCount,
    busiestHour: typeof busiestHour === 'number' ? (busiestHour === 0 ? '12 AM' : busiestHour < 12 ? `${busiestHour} AM` : busiestHour === 12 ? '12 PM' : `${busiestHour - 12} PM`) : 'No data',
  };
}

export default async function AIAnalyticsPage() {
  const data = await getAiAnalytics();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AI / ML Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Operational metrics below are calculated from stored QueueLess token records. Prediction-accuracy charts are hidden until actual prediction outcomes are persisted.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Tokens Today" value={data.todayTotal.toLocaleString()} icon={<Database size={20} />} />
        <Metric title="Completed Today" value={data.todayCompleted.toLocaleString()} icon={<Activity size={20} />} />
        <Metric title="Average Wait" value={data.avgWaitMinutes === null ? '—' : `${data.avgWaitMinutes} min`} icon={<Clock size={20} />} />
        <Metric title="Average Service Time" value={data.avgServiceMinutes === null ? '—' : `${data.avgServiceMinutes} min`} icon={<Timer size={20} />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today’s Queue Activity by Hour</CardTitle>
          <p className="text-sm text-slate-500">Real token creation counts from the database; no sample points are inserted.</p>
        </CardHeader>
        <CardContent>
          {data.todayTotal === 0 ? (
            <div className="flex h-56 items-center justify-center text-sm text-slate-500">No token records for today.</div>
          ) : (
            <div className="flex h-64 items-end gap-1 overflow-x-auto border-b border-slate-200 px-1 pt-4">
              {data.hours.map((point) => (
                <div key={point.hour} title={`${point.label}: ${point.count} tokens`} className="flex h-full min-w-4 flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-[10px] text-slate-500">{point.count || ''}</span>
                  <div className="w-full rounded-t bg-blue-600" style={{ height: point.count ? `${Math.max(4, (point.count / data.maxHourlyCount) * 80)}%` : '0%' }} />
                  <span className="text-[10px] text-slate-500">{point.hour % 3 === 0 ? point.label : ''}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle size={18} className="text-amber-600" /> Prediction Accuracy & Confidence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>No historical prediction-vs-actual outcome log is currently stored for this dashboard to calculate genuine accuracy, confidence trends, or total prediction counts.</p>
          <p>Those charts are intentionally not fabricated. To enable them, persist each prediction with its model version, predicted wait, timestamp, and the eventual actual wait, then calculate accuracy from matched records.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card><CardContent className="flex items-center gap-4 p-5">
      <div className="rounded-xl bg-blue-50 p-3 text-blue-600">{icon}</div>
      <div><p className="text-sm text-slate-500">{title}</p><p className="text-2xl font-bold text-slate-900">{value}</p></div>
    </CardContent></Card>
  );
}
