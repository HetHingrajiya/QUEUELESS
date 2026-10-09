"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  CheckCircle2, ArrowRight, Clock, ShieldCheck, Users 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { CitizenQueueSummary, ApiResponse } from '@/types/citizen';

function CheckInSuccessContent() {
  const searchParams = useSearchParams();
  const tokenIdParam = searchParams ? searchParams.get('tokenId') : null;

  const [data, setData] = useState<CitizenQueueSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfirmedToken = async () => {
      try {
        setLoading(true);
        if (tokenIdParam) {
          const res = await fetch(`/api/citizen/queue/${tokenIdParam}`);
          const json: ApiResponse<CitizenQueueSummary> = await res.json();
          if (json.success && json.data) {
            setData(json.data);
            return;
          }
        }

        const res = await fetch('/api/citizen/queue');
        const json: ApiResponse<CitizenQueueSummary> = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        }
      } catch (err: unknown) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfirmedToken();
  }, [tokenIdParam]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto pt-6">
        <SkeletonLoader type="queue" />
      </div>
    );
  }

  const token = data?.token;
  const tokenNumber = token?.tokenNumber || 'Data unavailable';
  const serviceName = token?.serviceName || 'Data unavailable';
  const officeName = token?.officeName || 'Data unavailable';
  const peopleAhead = data?.peopleAhead ?? 0;
  const estimatedWaitMin = data?.estimatedWaitMin ?? 0;

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-6 text-center">
      {/* Success Animated Graphic */}
      <div className="relative inline-block mx-auto">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-50 duration-500">
          <CheckCircle2 size={56} className="text-emerald-600" />
        </div>
        <div className="absolute -top-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full shadow-sm">
          <ShieldCheck size={16} />
        </div>
      </div>

      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Screen 25 • Check-In Complete
        </span>
        <h1 className="text-2xl font-black text-slate-900 mt-2">You&apos;re Checked In!</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          The counter officers have been notified of your presence in the waiting area.
        </p>
      </div>

      {/* Verified Token Card */}
      <Card className="border-emerald-200 bg-gradient-to-br from-white to-emerald-50/40 shadow-md text-left overflow-hidden">
        <div className="bg-emerald-600 h-2 w-full" />
        <CardContent className="p-6">
          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">YOUR TOKEN</p>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">{tokenNumber}</h2>
              <p className="text-xs font-semibold text-emerald-700 mt-0.5">{serviceName}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                Checked In
              </span>
              <p className="text-xs text-slate-400 mt-2">{officeName}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
              <span className="text-slate-400 flex items-center">
                <Users size={12} className="mr-1 text-blue-500" /> People Ahead
              </span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{peopleAhead}</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
              <span className="text-slate-400 flex items-center">
                <Clock size={12} className="mr-1 text-amber-500" /> Est. Wait Time
              </span>
              <p className="text-lg font-bold text-amber-600 mt-0.5">~{estimatedWaitMin}m</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-2 pt-2">
        <Link href={`/citizen/queue/${token?._id || ''}`} className="block w-full">
          <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-bold text-xs shadow-md">
            Monitor Live Turn <ArrowRight size={14} className="ml-1.5" />
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

export default function CheckInSuccessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading check-in confirmation...</div>}>
      <CheckInSuccessContent />
    </Suspense>
  );
}
