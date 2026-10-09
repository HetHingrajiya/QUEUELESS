"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, BrainCircuit, Zap, 
  Activity, Sparkles 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AIPrediction, ApiResponse, CitizenQueueSummary } from '@/types/citizen';

export default function AIWaitPredictionScreen() {
  const [modelStats, setModelStats] = useState({
    tokenNumber: "Data unavailable",
    serviceName: "Data unavailable",
    officeName: "Office",
    predictedWaitTime: 0,
    historicalAverage: 0,
    confidence: 0,
    activeCounters: 1,
    avgServicePace: "Calculating...",
    timeSavedMinutes: 0,
    factors: [
      { name: "Counter Staff Velocity", impact: "High Impact", desc: "Active counters operating at monitored pace", positive: true },
      { name: "Time of Day", impact: "Medium Impact", desc: "Operating window calculations based on real token volume", positive: true },
      { name: "Queue Backlog", impact: "High Impact", desc: "Real-time count of citizens ahead in this queue", positive: true },
      { name: "Service Average", impact: "Low Impact", desc: "Derived from historical service completion times", positive: true }
    ],
    hourlyTrends: [
      { hour: "9 AM", wait: 25, current: false },
      { hour: "10 AM", wait: 20, current: false },
      { hour: "11 AM", wait: 14, current: true },
      { hour: "12 PM", wait: 18, current: false },
      { hour: "2 PM", wait: 22, current: false },
      { hour: "4 PM", wait: 15, current: false },
    ]
  });

  useEffect(() => {
    async function loadRealPrediction() {
      try {
        const queueRes = await fetch('/api/citizen/queue');
        const queueJson: ApiResponse<CitizenQueueSummary> = await queueRes.json();
        if (queueJson.success && queueJson.data?.token?._id) {
          const tokenId = queueJson.data.token._id;
          const predRes = await fetch(`/api/citizen/queue/${tokenId}/prediction`);
          const predJson: ApiResponse<AIPrediction> = await predRes.json();
          if (predJson.success && predJson.data) {
            const pred = predJson.data;
            setModelStats(prev => {
              const hourlyRaw = pred.crowdPrediction?.hourly_trends as Array<{ hour: string; wait: number; current?: boolean }> | undefined;
              const trends = hourlyRaw?.map((t) => ({
                hour: t.hour,
                wait: t.wait,
                current: Boolean(t.current)
              })) || prev.hourlyTrends;

              const factorsList = [
                { name: "People Ahead", impact: "High Impact", desc: `${pred.waitingAhead ?? 0} citizens currently waiting ahead in this service`, positive: true },
                { name: "Active Counters", impact: "High Impact", desc: `${pred.activeCounters ?? 1} tellers serving this counter line`, positive: true },
                { name: "Queue Health", impact: "Medium Impact", desc: `Operational state is ${pred.queueHealth?.status || 'HEALTHY'} (${pred.queueHealth?.score ?? 80}/100)`, positive: true },
                { name: "Predicted Service Pace", impact: "Medium Impact", desc: `Expected counter duration: ~${pred.serviceTimePrediction?.predicted_service_time_mins ?? 10} mins`, positive: true },
                { name: "Optimal Visit Window", impact: "Low Impact", desc: `${pred.bestTimeToVisit?.best_window ?? '11 AM - 12 PM'} has lowest historical wait`, positive: true },
                { name: "Prediction Source", impact: "Low Impact", desc: `${pred.predictionSource || 'QueueMetrics Engine'} (${pred.modelVersion || 'rf-v2.1.0'})`, positive: true }
              ];

              return {
                ...prev,
                tokenNumber: pred.tokenNumber || (queueJson.data?.token?.tokenNumber ?? prev.tokenNumber),
                serviceName: pred.serviceName || (queueJson.data?.token?.serviceName ?? prev.serviceName),
                officeName: queueJson.data?.token?.officeName || prev.officeName,
                predictedWaitTime: pred.predictedWaitTime ?? (queueJson.data?.estimatedWaitMin ?? prev.predictedWaitTime),
                confidence: (pred.confidence && Number(pred.confidence) > 0) ? Math.round(Number(pred.confidence) <= 1 ? Number(pred.confidence) * 100 : Number(pred.confidence)) : 0,
                activeCounters: pred.activeCounters || prev.activeCounters,
                hourlyTrends: trends,
                factors: factorsList
              };
            });
          }
        }
      } catch (err: unknown) {
        console.error('Failed to load active prediction', err);
      }
    }
    loadRealPrediction();
  }, []);

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Link href="/citizen/queue" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
              Screen 22 • Live Queue
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">AI Wait Prediction</h1>
          </div>
        </div>
      </div>

      {/* Main AI Forecast Banner */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-700 via-indigo-700 to-blue-700 text-white shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-15">
          <BrainCircuit size={130} />
        </div>
        <CardContent className="p-6 relative z-10 text-center">
          <div className="inline-flex items-center space-x-1.5 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-white/20">
            <Sparkles size={14} className="text-amber-300" />
            <span>Random Forest Predictive Engine</span>
          </div>

          <p className="text-xs uppercase tracking-widest text-purple-200 font-semibold">PREDICTED WAIT TIME</p>
          <div className="flex items-baseline justify-center space-x-1 my-2">
            <span className="text-6xl font-black tracking-tight">{modelStats.predictedWaitTime}</span>
            <span className="text-2xl font-bold text-purple-200">mins</span>
          </div>
          
          <p className="text-xs text-purple-100">
            Token <strong className="text-white">{modelStats.tokenNumber}</strong> • {modelStats.serviceName}
          </p>

          <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-md border border-white/20 mt-5 grid grid-cols-2 gap-3 text-left">
            <div>
              <p className="text-[10px] text-purple-200 uppercase font-semibold">Model Confidence</p>
              <p className="text-lg font-bold text-emerald-300">{modelStats.confidence > 0 ? `${modelStats.confidence}% High` : 'Not available'}</p>
            </div>
            <div>
              <p className="text-[10px] text-purple-200 uppercase font-semibold">Time Saved vs Avg</p>
              <p className="text-lg font-bold text-amber-300">{modelStats.timeSavedMinutes > 0 ? `-${modelStats.timeSavedMinutes} mins` : 'Normal'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hourly Trend Bar Graph */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center">
              <Activity size={15} className="mr-2 text-blue-600" />
              Office Traffic Trend Today
            </h3>
            <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
              Optimal Window
            </span>
          </div>

          <div className="flex items-end justify-between h-32 pt-6 pb-2 px-2 border-b border-slate-100">
            {modelStats.hourlyTrends.map((bar, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1">
                <span className="text-[10px] font-bold text-slate-500 mb-1">{bar.wait}m</span>
                <div
                  className={`w-6 rounded-t-lg transition-all ${
                    bar.current
                      ? 'bg-gradient-to-t from-purple-600 to-indigo-600 shadow-md ring-2 ring-purple-300'
                      : 'bg-slate-200'
                  }`}
                  style={{ height: `${(bar.wait / 45) * 80}px` }}
                />
                <span className={`text-[10px] mt-2 font-medium ${bar.current ? 'text-purple-700 font-bold' : 'text-slate-400'}`}>
                  {bar.hour}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 text-center mt-2">
            You booked during the low-traffic dip (11 AM). Excellent timing!
          </p>
        </CardContent>
      </Card>

      {/* AI Key Prediction Factors */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center">
            <Zap size={15} className="mr-2 text-amber-500" />
            Model Influence Factors
          </h3>

          <div className="space-y-3">
            {modelStats.factors.map((factor, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-800">{factor.name}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      factor.impact === 'High Impact' ? 'bg-red-100 text-red-700' :
                      factor.impact === 'Medium Impact' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {factor.impact}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{factor.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Link href="/citizen/queue/leave-time">
          <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-semibold shadow-md">
            Calculate Best Departure Time
          </Button>
        </Link>
      </div>
    </div>
  );
}
