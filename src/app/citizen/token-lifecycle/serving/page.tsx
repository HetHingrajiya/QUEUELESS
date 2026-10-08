"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Activity, Clock, User, CheckCircle2, 
  ArrowRight, ShieldCheck, FileCheck 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ServiceStartedPage() {
  const [elapsedSec, setElapsedSec] = useState(0);
  const [tokenData, setTokenData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/citizen/queue')
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data?.token) {
          setTokenData(res.data.token);
        }
      })
      .catch(() => {});

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

  const tokenNumber = tokenData?.tokenNumber || 'A-001';
  const serviceName = tokenData?.serviceName || 'Government Service';
  const officeName = tokenData?.officeName || 'Government Office';

  const steps = [
    { name: "Identity & Citizen Verification", completed: true },
    { name: "Document Verification", completed: true },
    { name: "Counter Processing", completed: true },
    { name: "Final Approvals & Receipt", completed: false, inProgress: true }
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
          Your request for {serviceName} is currently being processed.
        </p>
      </div>

      {/* Active Session Card */}
      <Card className="border-blue-200 bg-white shadow-md text-left overflow-hidden">
        <CardContent className="p-5 space-y-4">
          <div className="flex justify-between items-start border-b border-slate-100 pb-3">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">SESSION TOKEN</p>
              <h2 className="text-2xl font-black text-slate-900">{tokenNumber}</h2>
              <p className="text-xs text-slate-500">{officeName}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                ACTIVE
              </span>
              <p className="text-xs font-mono font-bold text-slate-700 mt-1 flex items-center justify-end">
                <Clock size={11} className="mr-1 text-blue-600" /> {formatElapsed(elapsedSec)}
              </p>
            </div>
          </div>

          {/* Workflow Steps */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Workflow Status
            </h4>
            <div className="space-y-2">
              {steps.map((st, i) => (
                <div key={i} className="flex items-center space-x-2 text-xs">
                  {st.completed ? (
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin shrink-0" />
                  )}
                  <span className={st.completed ? "text-slate-700" : "font-bold text-blue-600"}>
                    {st.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="space-y-2">
        <Link href="/citizen/token-lifecycle/completed" className="block w-full">
          <Button className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md">
            Simulate Service Completed <ArrowRight size={14} className="ml-1.5" />
          </Button>
        </Link>
        <Link href="/citizen/home" className="block w-full">
          <Button variant="ghost" className="w-full text-xs text-slate-500">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
