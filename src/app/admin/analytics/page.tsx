"use client";

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Clock, Users, CheckCircle2, UserX, Building2, Timer, RefreshCw, Loader2, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

type AnyRecord = Record<string, any>;
type AnalyticsPayload = {
  waitingTime?: { data?: AnyRecord[]; kpis?: AnyRecord };
  serviceTime?: { data?: AnyRecord[]; kpis?: AnyRecord };
  peakHours?: { data?: AnyRecord[]; kpis?: AnyRecord };
  noShowRate?: { data?: AnyRecord[]; kpis?: AnyRecord };
  staffPerformance?: { data?: AnyRecord[]; kpis?: AnyRecord };
  officePerformance?: { data?: AnyRecord[]; kpis?: AnyRecord };
};

function MetricCard({ title, value, icon: Icon, detail }: { title: string; value: string | number; icon: any; detail?: string }) {
  return <Card><CardContent className="p-5 flex items-center gap-4">
    <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><Icon size={22} /></div>
    <div className="min-w-0"><p className="text-sm text-slate-500">{title}</p><p className="text-2xl font-bold text-slate-900">{value}</p>{detail && <p className="text-xs text-slate-500 mt-1">{detail}</p>}</div>
  </CardContent></Card>;
}

function ChartPanel({ title, children, empty }: { title: string; children: React.ReactNode; empty: boolean }) {
  return <Card><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent>
    {empty ? <div className="h-64 flex items-center justify-center text-sm text-slate-500">No recorded data available for this period.</div> : <div className="h-64 w-full">{children}</div>}
  </CardContent></Card>;
}

export default function AdminAnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [queue, setQueue] = useState<AnyRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [allRes, queueRes] = await Promise.all([
        fetch('/api/admin/analytics/all', { cache: 'no-store' }),
        fetch('/api/admin/analytics/queue', { cache: 'no-store' }),
      ]);
      const [allJson, queueJson] = await Promise.all([allRes.json(), queueRes.json()]);
      if (!allRes.ok || !allJson.success) throw new Error(allJson.message || 'Unable to load analytics.');
      setAnalytics(allJson.data || {});
      if (queueRes.ok && queueJson.success) setQueue(queueJson.data || {});
      else setQueue(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { setMounted(true); void load(); }, [load]);

  const waiting = analytics?.waitingTime;
  const service = analytics?.serviceTime;
  const peak = analytics?.peakHours;
  const noShow = analytics?.noShowRate;
  const staff = analytics?.staffPerformance;
  const office = analytics?.officePerformance;
  const queueKpis = queue?.kpis || {};
  const n = (v: unknown) => typeof v === 'number' && Number.isFinite(v) ? v : 0;

  return <div className="space-y-6 p-4 md:p-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h1 className="text-2xl font-bold text-slate-900">Organization Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">All queue, waiting time, service, peak-hour, no-show, staff and office reports in one place. Data is scoped to your organization.</p></div>
      <Button variant="outline" onClick={() => void load()} disabled={loading}>{loading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <RefreshCw size={16} className="mr-2" />}Refresh data</Button>
    </div>

    {error && <Card className="border-red-200"><CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-red-700"><span>{error}</span><Button variant="outline" size="sm" onClick={() => void load()}>Retry</Button></CardContent></Card>}

    <section className="space-y-3"><div><h2 className="text-lg font-semibold">Queue Overview</h2><p className="text-sm text-slate-500">Today’s token activity</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard title="Tokens Today" value={loading ? '—' : n(queueKpis.totalTokensToday)} icon={Users}/>
        <MetricCard title="Tokens Served Today" value={loading ? '—' : n(queueKpis.tokensServedToday)} icon={CheckCircle2}/>
        <MetricCard title="Average Wait Today" value={loading ? '—' : `${n(queueKpis.avgWaitMinutes)} min`} icon={Clock}/>
        <MetricCard title="Peak Queue Hour" value={loading ? '—' : (queueKpis.peakHour || 'No data')} icon={Activity}/>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartPanel title="Hourly Queue Volume & Wait Time" empty={!loading && !(queue?.hourlyData || []).some((x: AnyRecord) => n(x.tokens) > 0)}>
          {mounted && <ResponsiveContainer width="100%" height="100%"><LineChart data={queue?.hourlyData || []}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="time"/><YAxis/><Tooltip/><Legend/><Line type="monotone" dataKey="tokens" name="Tokens" stroke="#2563eb" strokeWidth={2}/><Line type="monotone" dataKey="waitTime" name="Avg wait (min)" stroke="#f97316" strokeWidth={2}/></LineChart></ResponsiveContainer>}
        </ChartPanel>
        <ChartPanel title="Most Used Services" empty={!loading && !(queue?.serviceData || []).length}>
          {mounted && <ResponsiveContainer width="100%" height="100%"><BarChart data={queue?.serviceData || []}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="count" name="Tokens" fill="#4f46e5" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer>}
        </ChartPanel>
      </div>
    </section>

    <section className="space-y-3"><div><h2 className="text-lg font-semibold">Waiting Time Analytics</h2><p className="text-sm text-slate-500">Completed-token wait durations over the recent seven-day window</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><MetricCard title="Average Wait (7 days)" value={loading ? '—' : `${n(waiting?.kpis?.avgWaitWeek)} min`} icon={Clock}/><MetricCard title="Maximum Wait Recorded" value={loading ? '—' : `${n(waiting?.kpis?.maxWaitWeek)} min`} icon={Timer}/></div>
      <ChartPanel title="Average and Maximum Waiting Time (Minutes)" empty={!loading && !(waiting?.data || []).some((x: AnyRecord) => n(x.avgWait) > 0 || n(x.maxWait) > 0)}>
        {mounted && <ResponsiveContainer width="100%" height="100%"><LineChart data={waiting?.data || []}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="day"/><YAxis/><Tooltip/><Legend/><Line type="monotone" dataKey="avgWait" name="Average wait" stroke="#2563eb" strokeWidth={2}/><Line type="monotone" dataKey="maxWait" name="Maximum wait" stroke="#dc2626" strokeWidth={2}/></LineChart></ResponsiveContainer>}
      </ChartPanel>
    </section>

    <section className="space-y-3"><div><h2 className="text-lg font-semibold">Service Time Analytics</h2><p className="text-sm text-slate-500">Recorded processing durations grouped by service</p></div>
      <MetricCard title="Average Service Time" value={loading ? '—' : `${n(service?.kpis?.globalAvgServiceTime)} min`} icon={Timer}/>
      <ChartPanel title="Average Service Time by Service (Minutes)" empty={!loading && !(service?.data || []).length}>
        {mounted && <ResponsiveContainer width="100%" height="100%"><BarChart data={service?.data || []}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="service" tick={{fontSize:11}}/><YAxis/><Tooltip/><Bar dataKey="avgTime" name="Average minutes" fill="#0891b2" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer>}
      </ChartPanel>
    </section>

    <section className="space-y-3"><div><h2 className="text-lg font-semibold">Peak Hours</h2><p className="text-sm text-slate-500">Today’s recorded token arrivals by hour</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><MetricCard title="Busiest Hour" value={loading ? '—' : (peak?.kpis?.peakHourStr || 'No data')} icon={TrendingUp}/><MetricCard title="Morning Tokens" value={loading ? '—' : n(peak?.kpis?.morningVolume)} icon={Activity}/><MetricCard title="Afternoon Tokens" value={loading ? '—' : n(peak?.kpis?.afternoonVolume)} icon={Activity}/></div>
      <ChartPanel title="Token Arrivals by Hour" empty={!loading && !(peak?.data || []).some((x: AnyRecord) => n(x.volume) > 0)}>
        {mounted && <ResponsiveContainer width="100%" height="100%"><AreaChart data={peak?.data || []}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="time"/><YAxis allowDecimals={false}/><Tooltip/><Area type="monotone" dataKey="volume" name="Tokens" stroke="#ea580c" fill="#fed7aa"/></AreaChart></ResponsiveContainer>}
      </ChartPanel>
    </section>

    <section className="space-y-3"><div><h2 className="text-lg font-semibold">No-Show Analytics</h2><p className="text-sm text-slate-500">Skipped/no-show tokens compared with completed tokens</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><MetricCard title="No-Shows (7 days)" value={loading ? '—' : n(noShow?.kpis?.totalNoShows)} icon={UserX}/><MetricCard title="Tokens Generated" value={loading ? '—' : n(noShow?.kpis?.totalGen)} icon={Users}/><MetricCard title="No-Show Rate" value={loading ? '—' : `${noShow?.kpis?.avgNoShowRate ?? '0.0'}%`} icon={TrendingUp}/></div>
      <ChartPanel title="Completed vs No-Show Tokens by Day" empty={!loading && !(noShow?.data || []).some((x: AnyRecord) => n(x.Served) > 0 || n(x['No Show']) > 0)}>
        {mounted && <ResponsiveContainer width="100%" height="100%"><BarChart data={noShow?.data || []}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis allowDecimals={false}/><Tooltip/><Legend/><Bar dataKey="Served" fill="#059669"/><Bar dataKey="No Show" fill="#dc2626"/></BarChart></ResponsiveContainer>}
      </ChartPanel>
    </section>

    <section className="space-y-3"><div><h2 className="text-lg font-semibold">Staff Performance</h2><p className="text-sm text-slate-500">Completed tokens attributed to staff in the selected organization</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><MetricCard title="Staff Members" value={loading ? '—' : n(staff?.kpis?.totalStaff)} icon={Users}/><MetricCard title="Top Performer" value={loading ? '—' : (staff?.kpis?.topPerformer || 'No data')} icon={CheckCircle2}/><MetricCard title="Fastest Average Service" value={loading ? '—' : `${n(staff?.kpis?.fastestTime)} min`} icon={Timer}/></div>
      <ChartPanel title="Completed Tokens by Staff" empty={!loading && !(staff?.data || []).some((x: AnyRecord) => n(x.served) > 0)}>
        {mounted && <ResponsiveContainer width="100%" height="100%"><BarChart data={staff?.data || []}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="served" name="Completed tokens" fill="#4f46e5" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer>}
      </ChartPanel>
    </section>

    <section className="space-y-3"><div><h2 className="text-lg font-semibold">Office Performance</h2><p className="text-sm text-slate-500">Compare workload and completion efficiency by office</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><MetricCard title="Offices" value={loading ? '—' : n(office?.kpis?.activeOffices)} icon={Building2}/><MetricCard title="Busiest Office" value={loading ? '—' : (office?.kpis?.busiestOffice || 'No data')} icon={Activity}/><MetricCard title="Most Efficient Office" value={loading ? '—' : (office?.kpis?.mostEfficient || 'No data')} icon={TrendingUp}/></div>
      <ChartPanel title="Office Tokens & Completion Efficiency" empty={!loading && !(office?.data || []).length}>
        {mounted && <ResponsiveContainer width="100%" height="100%"><BarChart data={office?.data || []}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis/><Tooltip/><Legend/><Bar dataKey="tokens" name="Tokens" fill="#2563eb" radius={[5,5,0,0]}/><Bar dataKey="efficiency" name="Completion efficiency (%)" fill="#059669" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer>}
      </ChartPanel>
    </section>
  </div>;
}
