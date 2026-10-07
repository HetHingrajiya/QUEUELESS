"use client";
import { PageHeader } from '@/components/common/PageHeader';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Loader2, UserMinus, Users, Activity } from 'lucide-react';

export default function NoShowAnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/admin/analytics/all');
        const json = await res.json();
        if (json.success) {
          setData(json.data.noShowRate);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  const { kpis, data: chartData } = data || { kpis: {}, data: [] };

  return (
    <div className="space-y-6 p-6">
      
      <PageHeader 
        title="No Show Analytics"
        description="Monitor missed appointments and queue drop-offs over the last 7 days."
      />


      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-full">
              <UserMinus size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total No Shows</p>
              <h3 className="text-2xl font-bold text-slate-800">{kpis.totalNoShows || 0}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Tokens Generated</p>
              <h3 className="text-2xl font-bold text-slate-800">{kpis.totalGen || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Avg No Show Rate</p>
              <h3 className="text-2xl font-bold text-slate-800">{kpis.avgNoShowRate || '0.0'}%</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">No Shows vs Served (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            {mounted && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Served" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar dataKey="No Show" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-full text-slate-500">
                No Data Available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
