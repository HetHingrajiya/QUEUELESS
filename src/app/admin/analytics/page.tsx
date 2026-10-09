"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, Clock, Users, CheckCircle2, UserX, Building2, 
  Timer, RefreshCw, Loader2, TrendingUp, BarChart3, 
  Sparkles, Award, ArrowUpRight, ShieldCheck, PieChart,
  Calendar, Layers, ChevronRight, Inbox
} from 'lucide-react';
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

// Custom High-Precision Chart Tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-xl p-3 shadow-xl border border-slate-800 space-y-1.5 z-50">
        <p className="font-semibold text-slate-300 border-b border-slate-800 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-bold text-white">
              {entry.value} {entry.name.toLowerCase().includes('wait') || entry.name.toLowerCase().includes('time') ? 'min' : ''}
              {entry.name.toLowerCase().includes('efficiency') || entry.name.toLowerCase().includes('rate') ? '%' : ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

// Enhanced Executive Metric Card
function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  detail, 
  trend,
  colorScheme = 'blue'
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  detail?: string;
  trend?: string;
  colorScheme?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'indigo';
}) {
  const schemes = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100 hover:border-blue-300' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100 hover:border-emerald-300' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100 hover:border-amber-300' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100 hover:border-purple-300' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100 hover:border-rose-300' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100 hover:border-indigo-300' },
  };

  const scheme = schemes[colorScheme] || schemes.blue;

  return (
    <Card className={`transition-all duration-200 border ${scheme.border} hover:shadow-md bg-white`}>
      <CardContent className="p-5 flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
          </div>
          {detail && <p className="text-xs text-slate-400 mt-1">{detail}</p>}
        </div>
        <div className={`rounded-xl p-3 ${scheme.bg} ${scheme.text} shadow-2xs shrink-0`}>
          <Icon size={22} />
        </div>
      </CardContent>
    </Card>
  );
}

// Chart Panel Container with Header and Responsive Canvas
function ChartPanel({ 
  title, 
  subtitle, 
  children, 
  empty,
  badge
}: { 
  title: string; 
  subtitle?: string; 
  children: React.ReactNode; 
  empty: boolean;
  badge?: string;
}) {
  return (
    <Card className="border-slate-200 shadow-xs bg-white overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-100/80 bg-slate-50/40">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              {title}
              {badge && (
                <Badge variant="outline" className="text-[10px] font-semibold py-0 px-2 bg-white text-slate-600 border-slate-200">
                  {badge}
                </Badge>
              )}
            </CardTitle>
            {subtitle && <CardDescription className="text-xs text-slate-500 mt-0.5">{subtitle}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {empty ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Inbox className="h-9 w-9 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No Recorded Activity</p>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xs">There are no logged tokens or reports available for this metric yet.</p>
          </div>
        ) : (
          <div className="h-72 w-full pt-1">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminAnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [queue, setQueue] = useState<AnyRecord | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'WAIT_TIMES' | 'EFFICIENCY' | 'STAFF_OFFICE' | 'ALL'>('OVERVIEW');

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

      const d = new Date();
      setLastRefreshed(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    setMounted(true); 
    void load(); 
  }, [load]);

  const waiting = analytics?.waitingTime;
  const service = analytics?.serviceTime;
  const peak = analytics?.peakHours;
  const noShow = analytics?.noShowRate;
  const staff = analytics?.staffPerformance;
  const office = analytics?.officePerformance;
  const queueKpis = queue?.kpis || {};
  const n = (v: unknown) => typeof v === 'number' && Number.isFinite(v) ? v : 0;

  // Calculate served completion rate
  const totalTokens = n(queueKpis.totalTokensToday);
  const servedTokens = n(queueKpis.tokensServedToday);
  const completionRate = totalTokens > 0 ? Math.round((servedTokens / totalTokens) * 100) : 0;

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Organization Analytics</h1>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 flex items-center gap-1.5 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </Badge>
          </div>
          <p className="text-sm text-slate-500">
            Real-time queue metrics, waiting patterns, staff efficiency, and operational benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {lastRefreshed && (
            <span className="text-xs text-slate-400 hidden sm:inline">
              Updated {lastRefreshed}
            </span>
          )}
          <Button 
            variant="outline" 
            onClick={() => void load()} 
            disabled={loading}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold shadow-2xs h-9 text-xs"
          >
            {loading ? <Loader2 size={14} className="mr-2 animate-spin text-blue-600" /> : <RefreshCw size={14} className="mr-2 text-slate-500" />}
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-red-700">
            <span className="font-medium">{error}</span>
            <Button variant="outline" size="sm" onClick={() => void load()} className="border-red-200 text-red-700 hover:bg-red-100">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
        {[
          { id: 'OVERVIEW', label: 'Executive Overview', icon: BarChart3 },
          { id: 'WAIT_TIMES', label: 'Wait Times & Queues', icon: Clock },
          { id: 'EFFICIENCY', label: 'Operational Efficiency', icon: TrendingUp },
          { id: 'STAFF_OFFICE', label: 'Staff & Offices', icon: Users },
          { id: 'ALL', label: 'All Reports', icon: Layers },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Tokens Today" 
          value={loading ? '—' : totalTokens} 
          icon={Users} 
          detail="Total created across all offices"
          colorScheme="blue"
        />
        <MetricCard 
          title="Tokens Served" 
          value={loading ? '—' : servedTokens} 
          icon={CheckCircle2} 
          detail={`${completionRate}% completion rate today`}
          colorScheme="emerald"
        />
        <MetricCard 
          title="Average Wait Today" 
          value={loading ? '—' : `${n(queueKpis.avgWaitMinutes)} min`} 
          icon={Clock} 
          detail={`Peak arrival hour: ${queueKpis.peakHour || 'N/A'}`}
          colorScheme="amber"
        />
        <MetricCard 
          title="No-Show Rate (7D)" 
          value={loading ? '—' : `${noShow?.kpis?.avgNoShowRate ?? '0.0'}%`} 
          icon={UserX} 
          detail={`${n(noShow?.kpis?.totalNoShows)} no-show tickets recorded`}
          colorScheme="rose"
        />
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {(activeTab === 'OVERVIEW' || activeTab === 'ALL') && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartPanel 
              title="Hourly Queue Volume & Average Wait" 
              subtitle="Breakdown of customer arrivals and wait duration throughout the day"
              badge="Today"
              empty={!loading && !(queue?.hourlyData || []).some((x: AnyRecord) => n(x.tokens) > 0)}
            >
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={queue?.hourlyData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorWait" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Area type="monotone" dataKey="tokens" name="Tokens Generated" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTokens)" />
                    <Area type="monotone" dataKey="waitTime" name="Avg Wait (min)" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorWait)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartPanel>

            <ChartPanel 
              title="Most In-Demand Services" 
              subtitle="Distribution of token traffic by government service category"
              badge="Today"
              empty={!loading && !(queue?.serviceData || []).length}
            >
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={queue?.serviceData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Tokens" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartPanel>
          </div>
        </div>
      )}

      {/* TAB 2: WAIT TIMES & QUEUES */}
      {(activeTab === 'WAIT_TIMES' || activeTab === 'ALL') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Waiting Time & Processing Analysis</h2>
              <p className="text-xs text-slate-500">Historical customer wait durations and service desk handling time.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard 
              title="7-Day Avg Wait" 
              value={loading ? '—' : `${n(waiting?.kpis?.avgWaitWeek)} min`} 
              icon={Clock} 
              detail="Across all completed tokens"
              colorScheme="blue"
            />
            <MetricCard 
              title="Max Wait Recorded" 
              value={loading ? '—' : `${n(waiting?.kpis?.maxWaitWeek)} min`} 
              icon={Timer} 
              detail="Peak congestion ceiling"
              colorScheme="rose"
            />
            <MetricCard 
              title="Avg Service Time" 
              value={loading ? '—' : `${n(service?.kpis?.globalAvgServiceTime)} min`} 
              icon={Activity} 
              detail="Counter handling duration"
              colorScheme="indigo"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartPanel 
              title="Average vs Maximum Wait Duration" 
              subtitle="7-day rolling wait time progression across all departments"
              badge="7 Days"
              empty={!loading && !(waiting?.data || []).some((x: AnyRecord) => n(x.avgWait) > 0 || n(x.maxWait) > 0)}
            >
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={waiting?.data || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Line type="monotone" dataKey="avgWait" name="Average Wait (min)" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="maxWait" name="Maximum Wait (min)" stroke="#dc2626" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartPanel>

            <ChartPanel 
              title="Service Duration by Offering" 
              subtitle="Average time required by counter officers to complete each transaction"
              badge="Averages"
              empty={!loading && !(service?.data || []).length}
            >
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={service?.data || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="service" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="avgTime" name="Average Minutes" fill="#0891b2" radius={[6, 6, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartPanel>
          </div>
        </div>
      )}

      {/* TAB 3: OPERATIONAL EFFICIENCY */}
      {(activeTab === 'EFFICIENCY' || activeTab === 'ALL') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Peak Hours & No-Show Attrition</h2>
              <p className="text-xs text-slate-500">Citizen arrival waves and queue dropout behavior.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard 
              title="Busiest Time Window" 
              value={loading ? '—' : (peak?.kpis?.peakHourStr || 'N/A')} 
              icon={TrendingUp} 
              detail="Highest concurrent token demand"
              colorScheme="amber"
            />
            <MetricCard 
              title="Morning Inflow" 
              value={loading ? '—' : n(peak?.kpis?.morningVolume)} 
              icon={Activity} 
              detail="Tokens between opening and 12:00 PM"
              colorScheme="blue"
            />
            <MetricCard 
              title="Afternoon Inflow" 
              value={loading ? '—' : n(peak?.kpis?.afternoonVolume)} 
              icon={Activity} 
              detail="Tokens after 12:00 PM"
              colorScheme="purple"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartPanel 
              title="Token Arrival Waves by Hour" 
              subtitle="Daily influx curve highlighting surge windows"
              badge="Hourly Wave"
              empty={!loading && !(peak?.data || []).some((x: AnyRecord) => n(x.volume) > 0)}
            >
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={peak?.data || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPeak" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="volume" name="Tokens" stroke="#ea580c" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPeak)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartPanel>

            <ChartPanel 
              title="Completed vs No-Show Ratio" 
              subtitle="Daily comparison of served citizens versus abandoned queue spots"
              badge="7 Days"
              empty={!loading && !(noShow?.data || []).some((x: AnyRecord) => n(x.Served) > 0 || n(x['No Show']) > 0)}
            >
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={noShow?.data || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Bar dataKey="Served" fill="#059669" radius={[5, 5, 0, 0]} maxBarSize={35} />
                    <Bar dataKey="No Show" fill="#dc2626" radius={[5, 5, 0, 0]} maxBarSize={35} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartPanel>
          </div>
        </div>
      )}

      {/* TAB 4: STAFF & OFFICE BENCHMARKS */}
      {(activeTab === 'STAFF_OFFICE' || activeTab === 'ALL') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Workforce & Office Performance</h2>
              <p className="text-xs text-slate-500">Service desk productivity, office load, and resolution benchmarks.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
              title="Active Staff" 
              value={loading ? '—' : n(staff?.kpis?.totalStaff)} 
              icon={Users} 
              detail="Serving officers in system"
              colorScheme="blue"
            />
            <MetricCard 
              title="Top Performer" 
              value={loading ? '—' : (staff?.kpis?.topPerformer || 'No data')} 
              icon={Award} 
              detail="Most completed tokens"
              colorScheme="emerald"
            />
            <MetricCard 
              title="Busiest Office" 
              value={loading ? '—' : (office?.kpis?.busiestOffice || 'No data')} 
              icon={Building2} 
              detail="Highest citizen footfall"
              colorScheme="indigo"
            />
            <MetricCard 
              title="Most Efficient Office" 
              value={loading ? '—' : (office?.kpis?.mostEfficient || 'No data')} 
              icon={TrendingUp} 
              detail="Highest completion ratio"
              colorScheme="purple"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartPanel 
              title="Tokens Completed by Staff Member" 
              subtitle="Individual throughput and service delivery rankings"
              badge="Staff Ranking"
              empty={!loading && !(staff?.data || []).some((x: AnyRecord) => n(x.served) > 0)}
            >
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={staff?.data || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="served" name="Tokens Served" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartPanel>

            <ChartPanel 
              title="Office Volume & Completion Efficiency" 
              subtitle="Comparative workload vs successful completion rate"
              badge="Office Efficiency"
              empty={!loading && !(office?.data || []).length}
            >
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={office?.data || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Bar dataKey="tokens" name="Tokens Generated" fill="#2563eb" radius={[5, 5, 0, 0]} maxBarSize={35} />
                    <Bar dataKey="efficiency" name="Completion Rate (%)" fill="#059669" radius={[5, 5, 0, 0]} maxBarSize={35} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartPanel>
          </div>
        </div>
      )}
    </div>
  );
}
