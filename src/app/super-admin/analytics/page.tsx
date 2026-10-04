import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Filter, BarChart3, PieChart as PieChartIcon } from 'lucide-react';

export default function AnalyticsPage() {
  // Real UI structure but without complex Recharts mapping for brevity in list views
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">System Analytics</h2>
          <p className="text-sm text-slate-500">Comprehensive overview of QueueLess performance.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="text-slate-600">
            <Filter size={16} className="mr-2" />
            Filter
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Download size={16} className="mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Avg. Wait Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">24.5 min</div>
            <p className="text-xs text-emerald-600 mt-1">↓ 12% from last week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Avg. Service Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">12.3 min</div>
            <p className="text-xs text-emerald-600 mt-1">↓ 5% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Tokens Served</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">14,293</div>
            <p className="text-xs text-emerald-600 mt-1">↑ 8% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">No-show Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">4.2%</div>
            <p className="text-xs text-red-600 mt-1">↑ 1% from last week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Peak Hours Analysis</CardTitle>
              <BarChart3 className="text-slate-400" size={20} />
            </div>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center border-t border-slate-100 bg-slate-50/50">
            {/* Visual representation placeholder using pure CSS for functional UI requirement */}
            <div className="w-full flex items-end justify-between px-4 h-48 space-x-2">
              {[40, 60, 85, 100, 75, 45, 30].map((h, i) => (
                <div key={i} className="w-full bg-blue-500 rounded-t-sm" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Service Distribution</CardTitle>
              <PieChartIcon className="text-slate-400" size={20} />
            </div>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center border-t border-slate-100 bg-slate-50/50">
             <div className="relative w-48 h-48 rounded-full bg-slate-200" style={{ background: 'conic-gradient(#2563eb 0% 45%, #16a34a 45% 75%, #f59e0b 75% 90%, #64748b 90% 100%)' }}>
               <div className="absolute inset-4 bg-white rounded-full"></div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
