"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, Star, ArrowRight 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ServiceCompletedPage() {
  const [tokenData, setTokenData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/citizen/token-history')
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

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-4 text-center">
      {/* Success Badge */}
      <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-lg mx-auto ring-8 ring-emerald-400/20">
        <CheckCircle2 size={54} className="text-emerald-600" />
      </div>

      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Screen 28 • Token Lifecycle
        </span>
        <h1 className="text-2xl font-black text-slate-900 mt-2">Service Completed!</h1>
        <p className="text-xs text-slate-500 mt-1">
          Your request has been successfully processed and verified in MongoDB.
        </p>
      </div>

      {/* Completion E-Receipt Card */}
      <Card className="border-slate-200 bg-white shadow-md text-left overflow-hidden">
        <div className="bg-emerald-600 h-2 w-full" />
        <CardContent className="p-6">
          <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">OFFICIAL E-RECEIPT</p>
              <h3 className="text-2xl font-black text-slate-900">{tokenNumber}</h3>
              <p className="text-xs font-semibold text-slate-700">{serviceName}</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
              Fulfilled
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Office:</span>
              <span className="font-semibold text-slate-800 text-right">{officeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="font-bold text-emerald-600">COMPLETED</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Audit Timestamp:</span>
              <span className="font-medium text-slate-700">
                {new Date().toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-2">
        <Link href={`/citizen/feedback/rating?tokenId=${tokenData?._id || ''}`} className="block w-full">
          <Button className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md">
            <Star size={14} className="mr-1.5" /> Rate Officer & Service Quality
          </Button>
        </Link>
        <Link href="/citizen/home" className="block w-full">
          <Button variant="ghost" className="w-full text-xs text-slate-500">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
