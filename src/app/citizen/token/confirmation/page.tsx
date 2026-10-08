"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, QrCode, ArrowRight, Clock, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';

function TokenConfirmationContent() {
  const searchParams = useSearchParams();
  const tokenIdParam = searchParams ? searchParams.get('tokenId') : null;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        setLoading(true);
        if (tokenIdParam) {
          const res = await fetch(`/api/citizen/queue/${tokenIdParam}`);
          const json = await res.json();
          if (json.success && json.data) {
            setData(json.data);
            return;
          }
        }

        const res = await fetch('/api/citizen/queue');
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, [tokenIdParam]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto pt-8">
        <SkeletonLoader type="queue" />
      </div>
    );
  }

  const token = data?.token || {};
  const tokenNumber = token.tokenNumber || 'A-001';
  const serviceName = token.serviceName || 'Government Service';
  const officeName = token.officeName || 'Government Office';
  const peopleAhead = data?.peopleAhead ?? 0;
  const estimatedWaitMin = data?.estimatedWaitMin ?? 15;
  const tokenId = token._id || tokenIdParam || '';

  return (
    <div className="space-y-6 pb-20 flex flex-col items-center pt-4 max-w-md mx-auto">
      <div className="w-18 h-18 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-1 shadow-sm">
        <CheckCircle2 size={38} />
      </div>
      <div className="text-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Screen 17 • Token Confirmation
        </span>
        <h1 className="text-2xl font-black text-slate-900 mt-2">Token Confirmed!</h1>
        <p className="text-xs text-slate-500 mt-0.5">Your official virtual queue ticket is now active</p>
      </div>

      <Card className="w-full border-blue-200 shadow-sm overflow-hidden relative bg-white">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-3 absolute top-0 left-0 right-0" />
        <CardContent className="p-6 text-center pt-8">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Your Token Number</p>
          <p className="text-5xl font-black text-slate-900 tracking-tight mb-6">{tokenNumber}</p>
          
          <div className="space-y-3 mb-6 text-xs text-left bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Service:</span>
              <span className="font-bold text-slate-900 text-right">{serviceName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Office:</span>
              <span className="font-bold text-slate-900 text-right">{officeName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Status:</span>
              <span className="font-bold text-emerald-600">WAITING IN QUEUE</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center mb-4 border border-slate-100">
            <QrCode size={120} className="text-slate-800" />
            <p className="text-[10px] text-slate-400 mt-2 font-mono">PASS #{tokenId.slice(-8) || 'TOKEN'}</p>
          </div>
          <p className="text-[11px] text-slate-400">Scan at office kiosk or reception upon arrival to check in</p>
        </CardContent>
      </Card>

      <div className="w-full grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-400 mb-0.5 flex items-center justify-center gap-1">
            <Users size={12} className="text-blue-500" /> People Ahead
          </p>
          <p className="font-black text-2xl text-slate-900">{peopleAhead}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-400 mb-0.5 flex items-center justify-center gap-1">
            <Clock size={12} className="text-amber-500" /> Est. Wait Time
          </p>
          <p className="font-black text-2xl text-amber-600">~{estimatedWaitMin}m</p>
        </div>
      </div>

      <div className="w-full space-y-2 pt-2">
        <Link href={`/citizen/queue/${tokenId}`} className="block w-full">
          <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-bold text-xs shadow-md">
            Go to Live Queue Tracker <ArrowRight size={14} className="ml-1.5" />
          </Button>
        </Link>
        <Link href="/citizen/queue/qr" className="block w-full">
          <Button variant="outline" className="w-full h-11 text-xs font-bold border-slate-200">
            View Full Screen Digital Pass
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function TokenConfirmation() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading token confirmation...</div>}>
      <TokenConfirmationContent />
    </Suspense>
  );
}
