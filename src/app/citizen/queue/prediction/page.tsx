"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, BrainCircuit, Clock, Zap, Target, 
  Activity, TrendingDown, Users, ShieldCheck, Sparkles 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AIWaitPredictionScreen() {
  const [modelStats] = useState({
    tokenNumber: "A-145",
    serviceName: "Driving Licence Renewal",
    officeName: "Regional Transport Office (RTO)",
    predictedWaitTime: 14,
    historicalAverage: 26,
    confidence: 94,
    activeCounters: 4,
    avgServicePace: "3.2 min / citizen",
    timeSavedMinutes: 12,
    factors: [
      { name: "Counter Staff Velocity", impact: "High Impact", desc: "4 active tellers operating at optimal pace", positive: true },
      { name: "Time of Day (Off-Peak)", impact: "Medium Impact", desc: "Morning rush has cleared; mid-day window", positive: true },
      { name: "Document Complexity", impact: "Low Impact", desc: "Digital verification requires minimal manual scans", positive: true },
      { name: "Walk-in Priority Quota", impact: "Low Impact", desc: "Senior citizen lane handling 2 urgent cases", positive: false }
    ],
    hourlyTrends: [
      { hour: "9 AM", wait: 35, current: false },
      { hour: "10 AM", wait: 28, current: false },
      { hour: "11 AM", wait: 14, current: true },
      { hour: "12 PM", wait: 18, current: false },
      { hour: "2 PM", wait: 40, current: false },
      { hour: "4 PM", wait: 22, current: false },
    ]
  });

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
              <p className="text-lg font-bold text-emerald-300">{modelStats.confidence}% High</p>
            </div>
            <div>
              <p className="text-[10px] text-purple-200 uppercase font-semibold">Time Saved vs Avg</p>
              <p className="text-lg font-bold text-amber-300">-{modelStats.timeSavedMinutes} mins</p>
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
