"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

type HourlyPoint = { hour: number; time: string; queue: number };
type ServicePoint = { name: string; value: number };

const COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#8B5CF6', '#64748B', '#0891B2', '#DB2777', '#65A30D'];

export function DashboardCharts({
  hourlyData,
  serviceData,
}: {
  hourlyData: HourlyPoint[];
  serviceData: ServicePoint[];
}) {
  const hasHourlyData = hourlyData.some((point) => point.queue > 0);
  const hasServiceData = serviceData.some((point) => point.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 border-0 bg-background shadow-neu rounded-2xl transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-neu-hover">
        <CardHeader>
          <CardTitle className="text-foreground uppercase tracking-wide">Queue Trend (Today)</CardTitle>
          <p className="text-sm font-semibold text-muted-foreground">Hourly token creation counts from the database.</p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {!hasHourlyData ? (
              <div className="flex h-full items-center justify-center text-sm font-semibold text-muted-foreground">
                No token activity recorded today.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value) => [Number(value ?? 0), 'Tokens']}
                    contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-neu)', color: 'var(--foreground)' }}
                  />
                  <Line type="monotone" dataKey="queue" name="Tokens" stroke="#2563EB" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-background shadow-neu rounded-2xl transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-neu-hover">
        <CardHeader>
          <CardTitle className="text-foreground uppercase tracking-wide">Service Distribution</CardTitle>
          <p className="text-sm font-semibold text-muted-foreground">Token totals grouped by actual service records.</p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex items-center justify-center">
            {!hasServiceData ? (
              <p className="text-center text-sm font-semibold text-muted-foreground">No service-linked token data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={serviceData} cx="50%" cy="45%" innerRadius={60} outerRadius={80} paddingAngle={3} dataKey="value" nameKey="name">
                    {serviceData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [Number(value ?? 0), 'Tokens']} contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-neu)', color: 'var(--foreground)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
