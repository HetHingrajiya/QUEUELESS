"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  XCircle, ArrowRight, RefreshCw, Calendar, 
  Building2, AlertCircle 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TokenCancelledPage() {
  const [tokenData, setTokenData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/citizen/token-history?status=CANCELLED')
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data && res.data.length > 0) {
          setTokenData(res.data[0]);
        }
      })
      .catch(() => {});
  }, []);

  const tokenNumber = tokenData?.tokenNumber || 'A-001';
  const serviceName = tokenData?.serviceName || 'Government Service';
  const officeName = tokenData?.officeName || 'Government Office';
  const reason = tokenData?.notes || 'Citizen voluntary cancellation';

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-6 text-center">
      {/* Cancellation Icon Graphic */}
      <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-lg mx-auto ring-8 ring-red-400/20">
        <XCircle size={56} className="text-red-600" />
      </div>

      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-red-800 bg-red-50 px-3 py-1 rounded-full border border-red-200">
          Screen 29 • Token Lifecycle
        </span>
        <h1 className="text-2xl font-black text-slate-900 mt-2">Token Cancelled</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          Your virtual queue ticket has been cancelled and your position in line released.
        </p>
      </div>

      {/* Cancellation Details Card */}
      <Card className="border-red-200 bg-white shadow-md text-left overflow-hidden">
        <div className="bg-red-500 h-2 w-full" />
        <CardContent className="p-6">
          <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">CANCELLED TICKET</p>
              <h3 className="text-3xl font-black text-slate-400 line-through">{tokenNumber}</h3>
              <p className="text-xs font-semibold text-slate-700">{serviceName}</p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-800 uppercase">
              Cancelled
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Office:</span>
              <span className="font-semibold text-slate-800">{officeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Reason:</span>
              <span className="font-medium text-slate-800">{reason}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rebook CTA */}
      <div className="space-y-2">
        <Link href="/citizen/token" className="block w-full">
          <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md">
            <RefreshCw size={14} className="mr-1.5" /> Book a New Token
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
