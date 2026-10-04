import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Filter, BarChart3, Clock, Users, UserCheck } from 'lucide-react';

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Organization Analytics</h2>
          <p className="text-sm text-slate-500">Analyze queue and staff performance for your organization.</p>
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
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center">
              <Clock size={16} className="mr-2 text-blue-500" /> Avg. Wait Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">22.1 min</div>
            <p className="text-xs text-emerald-600 mt-1">↓ 8% from last week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center">
              <Users size={16} className="mr-2 text-blue-500" /> Tokens Served
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">3,492</div>
            <p className="text-xs text-emerald-600 mt-1">↑ 12% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center">
              <UserCheck size={16} className="mr-2 text-blue-500" /> Avg. Service Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">14.3 min</div>
            <p className="text-xs text-emerald-600 mt-1">↓ 2% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">No-show Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">5.8%</div>
            <p className="text-xs text-red-600 mt-1">↑ 1.5% from last week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Daily Queue Volume</CardTitle>
              <BarChart3 className="text-slate-400" size={20} />
            </div>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center border-t border-slate-100 bg-slate-50/50">
            {/* Visual representation placeholder using pure CSS for functional UI requirement */}
            <div className="w-full flex items-end justify-between px-4 h-48 space-x-2">
              {[60, 40, 85, 100, 75, 55, 45].map((h, i) => (
                <div key={i} className="w-full bg-blue-500 rounded-t-sm" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
