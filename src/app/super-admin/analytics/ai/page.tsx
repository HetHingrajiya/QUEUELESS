"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { Loader2, Brain, Activity, Target, Clock, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function AIAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Simulate fetching ML analytics data
    const fetchAIData = async () => {
      setLoading(true);
      try {
        // Here we'd call an API that queries our Python FastAPI /analytics endpoint
        // For Phase 6 MVP, we mock the real-time visualization of the AI model performance
        setTimeout(() => {
          setData({
            modelStatus: "Online",
            lastTrained: "2 hours ago",
            avgConfidence: 91.4,
            totalPredictions: 1450,
            predictionAccuracyData: [
              { time: '09:00', actual: 12, predicted: 14 },
              { time: '10:00', actual: 25, predicted: 23 },
              { time: '11:00', actual: 45, predicted: 42 },
              { time: '12:00', actual: 30, predicted: 32 },
              { time: '13:00', actual: 20, predicted: 19 },
              { time: '14:00', actual: 35, predicted: 37 },
              { time: '15:00', actual: 55, predicted: 50 },
            ],
            confidenceTrend: [
              { day: 'Mon', score: 88 },
              { day: 'Tue', score: 89 },
              { day: 'Wed', score: 90 },
              { day: 'Thu', score: 89.5 },
              { day: 'Fri', score: 91.4 },
            ]
          });
          setLoading(false);
        }, 800);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchAIData();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 pb-20">
      <PageHeader 
        title="AI / ML Portal Analytics" 
        description="Monitor the real-time performance and accuracy of the Wait Time Prediction Model."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Model Status</p>
              <h3 className="text-2xl font-bold text-slate-800 flex items-center">
                {data.modelStatus}
                <span className="relative flex h-3 w-3 ml-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
              <Target size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Avg. Confidence</p>
              <h3 className="text-2xl font-bold text-slate-800">{data.avgConfidence}%</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
              <Brain size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Predictions (Today)</p>
              <h3 className="text-2xl font-bold text-slate-800">{data.totalPredictions.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Last Trained</p>
              <h3 className="text-2xl font-bold text-slate-800 text-lg">{data.lastTrained}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prediction Accuracy Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Wait Time Accuracy (Actual vs Predicted)</CardTitle>
            <CardDescription>Comparison of real wait times against AI predictions across the day.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.predictionAccuracyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="actual" name="Actual Wait (mins)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="predicted" name="AI Predicted (mins)" stroke="#10b981" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Confidence Score Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Confidence Score Trend</CardTitle>
            <CardDescription>Model confidence progression over the last 5 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.confidenceTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <YAxis domain={['dataMin - 5', 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="score" name="Confidence (%)" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4 flex items-start space-x-3">
          <AlertTriangle className="text-blue-500 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-semibold text-blue-800">Model Insights</h4>
            <p className="text-sm text-blue-700 mt-1">
              The AI model shows a slight under-prediction bias during peak hours (14:00 - 15:00). 
              The system will automatically retrain on the new dataset at midnight to adjust the Random Forest weights.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
