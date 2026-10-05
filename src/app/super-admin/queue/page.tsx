import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, PlayCircle, CheckCircle2, XCircle, AlertTriangle, MonitorPlay } from 'lucide-react';
import dbConnect from '@/lib/db';
import { Token } from '@/models/Token';
import { Counter } from '@/models/Counter';

async function getQueueStats() {
  await dbConnect();
  
  const [
    waitingCount,
    servingCount,
    completedCount,
    skippedCount,
    noShowCount,
    activeCountersCount
  ] = await Promise.all([
    Token.countDocuments({ status: 'WAITING' }),
    Token.countDocuments({ status: 'SERVING' }),
    Token.countDocuments({ status: 'COMPLETED' }),
    Token.countDocuments({ status: 'SKIPPED' }),
    Token.countDocuments({ status: 'NO_SHOW' }),
    Counter.countDocuments({ status: 'ACTIVE' })
  ]);

  return {
    waitingCount,
    servingCount,
    completedCount,
    skippedCount,
    noShowCount,
    activeCountersCount
  };
}

export default async function SuperAdminQueueOverview() {
  const stats = await getQueueStats();

  const cards = [
    { title: 'Waiting', value: stats.waitingCount, icon: <Users className="h-6 w-6 text-blue-600" />, color: 'bg-blue-50' },
    { title: 'Currently Serving', value: stats.servingCount, icon: <PlayCircle className="h-6 w-6 text-emerald-600" />, color: 'bg-emerald-50' },
    { title: 'Completed', value: stats.completedCount, icon: <CheckCircle2 className="h-6 w-6 text-slate-600" />, color: 'bg-slate-50' },
    { title: 'Skipped', value: stats.skippedCount, icon: <AlertTriangle className="h-6 w-6 text-amber-600" />, color: 'bg-amber-50' },
    { title: 'No-Show', value: stats.noShowCount, icon: <XCircle className="h-6 w-6 text-red-600" />, color: 'bg-red-50' },
    { title: 'Active Queues (Counters)', value: stats.activeCountersCount, icon: <MonitorPlay className="h-6 w-6 text-purple-600" />, color: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Queue Management Overview</h2>
          <p className="text-sm text-slate-500">System-wide real-time queue statistics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <Card key={idx} className="overflow-hidden border-none shadow-sm">
            <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${card.color}`}>
              <CardTitle className="text-sm font-medium text-slate-700">
                {card.title}
              </CardTitle>
              {card.icon}
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-slate-900">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

