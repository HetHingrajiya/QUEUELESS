"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Ticket, CheckCircle2, Clock, MapPin, Briefcase, Loader2, Activity } from 'lucide-react';
import { getSocket } from '@/lib/socketClient';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        
        if (userData.success) {
          setUser(userData.data);
          
          if (userData.data.officeId) {
            const socket = getSocket();
            socket.emit('join-office', userData.data.officeId);
            
            socket.on('queue:updated', () => {
              fetchDashboardData(); 
            });
            
            socket.on('token:called', () => {
              fetchDashboardData(); 
            });
          }

          await fetchDashboardData();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      const socket = getSocket();
      socket.off('queue:updated');
      socket.off('token:called');
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Admin Dashboard</h2>
        <div className="px-4 py-2 bg-white rounded-lg border border-slate-200 text-sm font-medium text-slate-600 shadow-sm flex items-center">
          <MapPin size={16} className="mr-2 text-blue-500" />
          <span className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Sync</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Counters" value={`${data?.activeCounters || 0} / ${data?.totalCounters || 0}`} icon={<Briefcase size={20} className="text-blue-500" />} />
        <StatCard title="Total Staff" value={data?.totalStaff || 0} icon={<Users size={20} className="text-purple-500" />} />
        <StatCard title="Waiting Citizens" value={data?.waitingTokens || 0} icon={<Clock size={20} className="text-amber-500" />} />
        <StatCard title="Services Completed" value={data?.completedTokens || 0} icon={<CheckCircle2 size={20} className="text-emerald-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Counter Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.counters && data.counters.length > 0 ? (
                data.counters.map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold uppercase">
                        {c.name.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.serviceIds && c.serviceIds.length > 0 ? c.serviceIds.map((s: any) => s.name).join(', ') : 'All Services'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end mt-1">
                        <span className={`w-2 h-2 rounded-full mr-2 ${c.isOnline ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        <span className="text-xs text-slate-500">{c.isOnline ? 'Online' : 'Offline'}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No counters configured.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Queue Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
              {data?.recentActivity && data.recentActivity.length > 0 ? (
                data.recentActivity.map((activity: any, i: number) => {
                  let color = 'text-slate-600';
                  let icon = <Activity size={14} className="mr-1" />;
                  
                  if (activity.status === 'COMPLETED' || activity.status === 'token:completed') color = 'text-emerald-600';
                  else if (activity.status === 'NO_SHOW' || activity.status === 'SKIPPED') color = 'text-red-600';
                  else if (activity.status === 'SERVING' || activity.status === 'token:called') color = 'text-blue-600';
                  
                  return (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{activity.tokenNumber}</span>
                        <span className={`text-xs flex items-center mt-0.5 font-medium ${color}`}>
                          {icon} {activity.status.replace('token:', '').toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(activity.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No recent activity.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">
          {title}
        </CardTitle>
        <div className="p-2 bg-slate-50 rounded-lg">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
      </CardContent>
    </Card>
  );
}
