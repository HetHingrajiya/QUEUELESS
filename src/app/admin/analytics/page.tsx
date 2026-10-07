"use client";
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Filter, Clock, Users, UserCheck, TrendingDown, X, Loader2, RefreshCw } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface AnalyticsSummary {
  total: number;
  waiting: number;
  serving: number;
  completed: number;
  cancelled: number;
  skipped: number;
  noShow: number;
  avgWaitMin: number;
  avgServiceMin: number;
  noShowRate: string;
  completionRate: string;
}

interface DailyBucket { day: string; count: number; }

export default function AdminAnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [dailyData, setDailyData] = useState<DailyBucket[]>([]);
  const [offices, setOffices] = useState<{ _id: string; name: string }[]>([]);
  const [services, setServices] = useState<{ _id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    officeId: '',
    serviceId: '',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    fetch('/api/offices').then(r => r.json()).then(d => { if (d.success) setOffices(d.data || []); });
    fetch('/api/services').then(r => r.json()).then(d => { if (d.success) setServices(d.data || []); });
  }, []);

  const fetchAnalytics = useCallback(async (f: typeof appliedFilters) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        startDate: f.startDate,
        endDate: f.endDate,
        ...(f.officeId && { officeId: f.officeId }),
        ...(f.serviceId && { serviceId: f.serviceId }),
      });
      const res = await fetch(`/api/admin/analytics?${params}`);
      const json = await res.json();
      if (json.success) {
        setSummary(json.data.summary);
        setDailyData(json.data.dailyVolume || []);
      } else {
        setError(json.message || 'Failed to load analytics.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnalytics(appliedFilters); }, [fetchAnalytics, appliedFilters]);

  const applyFilters = () => { setAppliedFilters({ ...filters }); setShowFilters(false); };
  const resetFilters = () => {
    const def = {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      officeId: '',
      serviceId: '',
    };
    setFilters(def);
    setAppliedFilters(def);
    setShowFilters(false);
  };

  const exportCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        startDate: appliedFilters.startDate,
        endDate: appliedFilters.endDate,
        ...(appliedFilters.officeId && { officeId: appliedFilters.officeId }),
        ...(appliedFilters.serviceId && { serviceId: appliedFilters.serviceId }),
        format: 'csv',
      });
      const res = await fetch(`/api/admin/analytics/export?${params}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `queueless-analytics-${appliedFilters.startDate}-to-${appliedFilters.endDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const stats = [
    { label: 'Avg. Wait Time', value: summary ? `${summary.avgWaitMin} min` : '—', icon: <Clock size={16} className="mr-2 text-blue-500" />, note: null },
    { label: 'Tokens Served', value: summary?.completed ?? '—', icon: <Users size={16} className="mr-2 text-blue-500" />, note: null },
    { label: 'Avg. Service Time', value: summary ? `${summary.avgServiceMin} min` : '—', icon: <UserCheck size={16} className="mr-2 text-blue-500" />, note: null },
    { label: 'No-show Rate', value: summary ? `${summary.noShowRate}%` : '—', icon: <TrendingDown size={16} className="mr-2 text-red-500" />, note: null },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Organization Analytics</h2>
          <p className="text-sm text-slate-500">
            {appliedFilters.startDate} → {appliedFilters.endDate}
            {appliedFilters.officeId && ` · Office filtered`}
            {appliedFilters.serviceId && ` · Service filtered`}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="text-slate-600" onClick={() => setShowFilters(v => !v)}>
            <Filter size={16} className="mr-2" /> Filter
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={exportCSV} disabled={exporting || loading}>
            {exporting ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Download size={16} className="mr-2" />}
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="border-blue-200 bg-blue-50/40">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1">
                <Label>Start Date</Label>
                <Input type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>End Date</Label>
                <Input type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Office</Label>
                <select value={filters.officeId} onChange={e => setFilters(f => ({ ...f, officeId: e.target.value }))}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white">
                  <option value="">All Offices</option>
                  {offices.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Service</Label>
                <select value={filters.serviceId} onChange={e => setFilters(f => ({ ...f, serviceId: e.target.value }))}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white">
                  <option value="">All Services</option>
                  {services.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button className="bg-blue-600 hover:bg-blue-700 text-sm" onClick={applyFilters}>Apply Filters</Button>
              <Button variant="outline" className="text-sm" onClick={resetFilters}><X size={14} className="mr-1" /> Reset</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center justify-between text-red-600 text-sm">
            {error}
            <Button variant="ghost" size="sm" onClick={() => fetchAnalytics(appliedFilters)}>
              <RefreshCw size={14} className="mr-1" /> Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center">
                {s.icon} {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading
                ? <div className="h-8 w-24 bg-slate-200 animate-pulse rounded" />
                : <div className="text-3xl font-bold text-slate-900">{String(s.value)}</div>
              }
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Cards */}
      {!loading && summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Tokens', value: summary.total, color: 'text-slate-800' },
            { label: 'Waiting', value: summary.waiting, color: 'text-blue-600' },
            { label: 'Skipped', value: summary.skipped, color: 'text-amber-600' },
            { label: 'No-Show', value: summary.noShow, color: 'text-red-600' },
            { label: 'Cancelled', value: summary.cancelled, color: 'text-slate-500' },
            { label: 'Currently Serving', value: summary.serving, color: 'text-emerald-600' },
            { label: 'Completion Rate', value: `${summary.completionRate}%`, color: 'text-emerald-700' },
            { label: 'No-show Rate', value: `${summary.noShowRate}%`, color: 'text-red-600' },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-100 p-4 shadow-sm">
              <p className="text-xs text-slate-500 font-medium mb-1">{item.label}</p>
              <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Daily Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Queue Volume</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <Loader2 className="animate-spin mr-2" /> Loading...
            </div>
          ) : dailyData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              No analytics data available for the selected period.
            </div>
          ) : mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
