"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Bell, Volume2, ArrowRight, MapPin, Clock, 
  AlertTriangle, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TokenCalledPage() {
  const [timeLeft, setTimeLeft] = useState(300); // 5m countdown
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
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const tokenNumber = tokenData?.tokenNumber || 'A-001';
  const serviceName = tokenData?.serviceName || 'Government Service';
  const officeName = tokenData?.officeName || 'Government Office';

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-4 text-center">
      {/* High Alert Badge & Icon */}
      <div className="relative inline-block mx-auto">
        <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shadow-lg ring-8 ring-amber-400/20 animate-pulse">
          <Volume2 size={48} className="text-amber-600 animate-bounce" />
        </div>
      </div>

      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
          Screen 26 • Token Lifecycle
        </span>
        <h1 className="text-3xl font-black text-slate-900 mt-2">YOUR TOKEN IS CALLED!</h1>
        <p className="text-xs text-slate-500 mt-1">Please proceed directly to your assigned service counter now.</p>
      </div>

      {/* Target Counter Card */}
      <Card className="border-amber-300 bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white shadow-xl overflow-hidden">
        <CardContent className="p-6 text-center">
          <p className="text-xs uppercase tracking-widest text-amber-100 font-bold">TOKEN {tokenNumber}</p>
          <div className="my-3">
            <span className="text-xs font-semibold bg-white/20 backdrop-blur-md px-3 py-1 rounded-full uppercase">
              ASSIGNED COUNTER
            </span>
            <h2 className="text-5xl font-black tracking-tight my-2">COUNTER 1</h2>
            <p className="text-sm font-semibold text-amber-100">{serviceName} • {officeName}</p>
          </div>

          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/20 mt-4">
            <p className="text-[11px] uppercase tracking-wider text-amber-100 font-semibold mb-1">
              Time Remaining to Report at Counter
            </p>
            <p className="text-4xl font-mono font-black tracking-widest text-white">
              {formatTimer(timeLeft)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="space-y-2">
        <Link href="/citizen/token-lifecycle/serving" className="block w-full">
          <Button className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md">
            I Have Arrived at Counter <ArrowRight size={14} className="ml-1.5" />
          </Button>
        </Link>
        <Link href={`/citizen/queue/${tokenData?._id || ''}`} className="block w-full">
          <Button variant="ghost" className="w-full text-xs text-slate-500">
            View Live Queue Pass
          </Button>
        </Link>
      </div>
    </div>
  );
}
