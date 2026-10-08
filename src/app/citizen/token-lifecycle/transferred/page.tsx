"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowRightLeft, ArrowRight 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TokenTransferredPage() {
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
  }, []);

  const tokenNumber = tokenData?.tokenNumber || 'A-001';
  const serviceName = tokenData?.serviceName || 'Government Service';

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-4 text-center">
      {/* Transfer Animated Graphic */}
      <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shadow-lg mx-auto ring-8 ring-indigo-400/20">
        <ArrowRightLeft size={48} className="text-indigo-600 animate-pulse" />
      </div>

      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
          Screen 31 • Token Lifecycle
        </span>
        <h1 className="text-2xl font-black text-slate-900 mt-2">Token Transferred</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          Your file for {serviceName} has been routed to a specialized desk.
        </p>
      </div>

      {/* Transfer Routing Box */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-700 via-blue-700 to-slate-900 text-white shadow-xl overflow-hidden text-left">
        <CardContent className="p-6">
          <p className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">TRANSFER ASSIGNMENT</p>
          <div className="my-3 flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-xs text-indigo-200">Previous Station</p>
              <p className="text-sm font-semibold">Counter 1 (Intake)</p>
            </div>
            <ArrowRight size={20} className="text-indigo-300" />
            <div className="text-right">
              <p className="text-xs text-indigo-200">New Station</p>
              <p className="text-base font-black text-emerald-300">Counter 2 (Specialist)</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-indigo-100">
            <div className="flex justify-between">
              <span>Token:</span>
              <span className="font-bold text-white font-mono">{tokenNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Queue Priority:</span>
              <span className="font-bold text-emerald-300">Retained</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="space-y-2">
        <Link href={`/citizen/queue/${tokenData?._id || ''}`} className="block w-full">
          <Button className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md">
            View Live Queue Pass <ArrowRight size={14} className="ml-1.5" />
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
