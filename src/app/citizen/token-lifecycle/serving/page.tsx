"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Activity, Clock, User, CheckCircle2, 
  ArrowRight, ShieldCheck, FileCheck, RefreshCw 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ServiceStartedPage() {
  const [elapsedSec, setElapsedSec] = useState(195); // 3m 15s elapsed

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSec(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const steps = [
    { name: "Identity & Aadhaar Verification", completed: true },
    { name: "Original Documents Scanned", completed: true },
    { name: "Biometric & Digital Signature", completed: true },
    { name: "Final Approval & Certificate Printing", completed: false, inProgress: true }
  ];

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-4 text-center">
      {/* Active Pulse Animation */}
      <div className="relative inline-block mx-auto">
        <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-lg ring-8 ring-blue-400/20">
          <Activity size={48} className="text-blue-600 animate-pulse" />
        </div>
      </div>

      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          Screen 27 • Token Lifecycle
        </span>
        <h1 className="text-2xl font-black text-slate-900 mt-2">Service In Progress</h1>
        <p className="text-xs text-slate-500 mt-1">
          Your request is currently being processed at Counter 4.
        </p>
      </div>

      {/* Live Session Details */}
      <Card className="border-blue-200 bg-white shadow-md text-left overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 w-full"></div>
        <CardContent className="p-5">
          <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-3">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">SESSION TOKEN</p>
              <h3 className="text-3xl font-black text-slate-900">A-145</h3>
              <p className="text-xs font-semibold text-blue-600 mt-0.5">Driving Licence Renewal</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                Active Session
              </span>
              <div className="mt-2 text-right">
                <p className="text-[10px] text-slate-400">Duration Elapsed</p>
                <p className="text-lg font-bold font-mono text-slate-900">{formatElapsed(elapsedSec)}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
              <User size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Officer Rajesh Sharma</p>
              <p className="text-[11px] text-slate-500">Counter 4 • Assistant RTO Licensing Officer</p>
            </div>
          </div>

          {/* Workflow progress checklist */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Processing Checklist</p>
            <div className="space-y-2">
              {steps.map((st, i) => (
                <div key={i} className="flex items-center text-xs">
                  {st.completed ? (
                    <CheckCircle2 size={16} className="text-emerald-500 mr-2 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mr-2 shrink-0" />
                  )}
                  <span className={st.completed ? 'text-slate-600 line-through' : 'font-bold text-slate-900'}>
                    {st.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Next Step */}
      <div className="space-y-2 pt-2">
        <Link href="/citizen/token-lifecycle/completed" className="block w-full">
          <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-bold shadow-md">
            Simulate Service Completion <ArrowRight size={16} className="ml-2" />
          </Button>
        </Link>
        <Link href="/citizen/home" className="block w-full">
          <Button variant="ghost" className="w-full text-xs text-slate-500">
            Keep Running in Background
          </Button>
        </Link>
      </div>
    </div>
  );
}
