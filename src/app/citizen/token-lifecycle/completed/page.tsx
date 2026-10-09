"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Star, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CitizenToken, ApiResponse, CitizenQueueSummary } from '@/types/citizen';

function ServiceCompletedContent() {
  const searchParams = useSearchParams();
  const tokenIdParam = searchParams ? searchParams.get('tokenId') : null;

  const [tokenData, setTokenData] = useState<CitizenToken | null>(null);

  useEffect(() => {
    const fetchCompletedToken = async () => {
      try {
        if (tokenIdParam) {
          const res = await fetch(`/api/citizen/queue/${tokenIdParam}`);
          const json: ApiResponse<CitizenQueueSummary> = await res.json();
          if (json.success && json.data?.token) {
            setTokenData(json.data.token);
            return;
          }
        }

        const histRes = await fetch('/api/citizen/token-history');
        const histJson: ApiResponse<CitizenToken[]> = await histRes.json();
        if (histJson.success && histJson.data && histJson.data.length > 0) {
          setTokenData(histJson.data[0]);
        }
      } catch {
        // ignore
      }
    };

    fetchCompletedToken();
  }, [tokenIdParam]);

  const tokenNumber = tokenData?.tokenNumber || 'Data unavailable';
  const serviceName = tokenData?.serviceName || 'Data unavailable';
  const officeName = tokenData?.officeName || 'Data unavailable';
  const counterName = tokenData?.counterName || (tokenData?.counterNumber ? `Counter ${tokenData.counterNumber}` : null);
  const completionTimestamp = tokenData?.completedAt || tokenData?.completionTime;

  // Actual Duration Calculation
  let durationDisplay = 'Not available';
  if (tokenData?.processingTime && tokenData.processingTime > 0) {
    const mins = Math.floor(tokenData.processingTime / 60);
    const secs = tokenData.processingTime % 60;
    durationDisplay = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  } else if (tokenData?.startTime && completionTimestamp) {
    const diffSec = Math.max(1, Math.floor((new Date(completionTimestamp).getTime() - new Date(tokenData.startTime).getTime()) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    durationDisplay = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }

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
          Your service request has been successfully completed and recorded.
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
            {counterName && (
              <div className="flex justify-between">
                <span className="text-slate-400">Counter:</span>
                <span className="font-semibold text-slate-800 text-right">{counterName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="font-bold text-emerald-600">COMPLETED</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Completed At:</span>
              <span className="font-medium text-slate-700">
                {completionTimestamp 
                  ? new Date(completionTimestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : 'Not available'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Actual Duration:</span>
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <Clock size={11} className="text-emerald-600" /> {durationDisplay}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-2">
        <Link href={`/citizen/feedback/rating?tokenId=${tokenData?._id || tokenIdParam || ''}`} className="block w-full">
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

export default function ServiceCompletedPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading service completion...</div>}>
      <ServiceCompletedContent />
    </Suspense>
  );
}
