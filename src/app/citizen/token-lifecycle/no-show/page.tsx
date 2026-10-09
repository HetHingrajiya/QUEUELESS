"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CitizenToken, ApiResponse, CitizenQueueSummary } from '@/types/citizen';

function TokenNoShowContent() {
  const searchParams = useSearchParams();
  const tokenIdParam = searchParams ? searchParams.get('tokenId') : null;

  const [tokenData, setTokenData] = useState<CitizenToken | null>(null);

  useEffect(() => {
    const fetchNoShowToken = async () => {
      try {
        if (tokenIdParam) {
          const res = await fetch(`/api/citizen/queue/${tokenIdParam}`);
          const json: ApiResponse<CitizenQueueSummary> = await res.json();
          if (json.success && json.data?.token) {
            setTokenData(json.data.token);
            return;
          }
        }

        const histRes = await fetch('/api/citizen/token-history?status=NO_SHOW');
        const histJson: ApiResponse<CitizenToken[]> = await histRes.json();
        if (histJson.success && histJson.data && histJson.data.length > 0) {
          setTokenData(histJson.data[0]);
        }
      } catch {
        // ignore
      }
    };

    fetchNoShowToken();
  }, [tokenIdParam]);

  const tokenNumber = tokenData?.tokenNumber || 'Data unavailable';
  const serviceName = tokenData?.serviceName || 'Data unavailable';
  const officeName = tokenData?.officeName || 'Data unavailable';
  const actualStatus = tokenData?.status || 'NO_SHOW';
  const recordedTime = tokenData?.endTime || tokenData?.callTime || tokenData?.updatedAt;

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-6 text-center">
      {/* Alert Warning Graphic */}
      <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shadow-lg mx-auto ring-8 ring-amber-400/20">
        <AlertTriangle size={54} className="text-amber-600" />
      </div>

      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          Screen 30 • Token Lifecycle
        </span>
        <h1 className="text-2xl font-black text-slate-900 mt-2">
          {actualStatus === 'SKIPPED' ? 'Token Skipped' : 'Token Marked as No-Show'}
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          The reporting window passed before check-in was registered at the assigned counter.
        </p>
      </div>

      {/* Details Card */}
      <Card className="border-amber-200 bg-white shadow-md text-left overflow-hidden">
        <div className="bg-amber-500 h-2 w-full" />
        <CardContent className="p-6">
          <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">MISSED TOKEN</p>
              <h3 className="text-3xl font-black text-slate-700">{tokenNumber}</h3>
              <p className="text-xs font-semibold text-slate-600">{serviceName}</p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 uppercase">
              {actualStatus}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Office:</span>
              <span className="font-semibold text-slate-800">{officeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Actual Status:</span>
              <span className="font-bold text-amber-700">{actualStatus}</span>
            </div>
            {recordedTime && (
              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp:</span>
                <span className="font-medium text-slate-800">
                  {new Date(recordedTime).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Re-Entry Policy:</span>
              <span className="font-bold text-emerald-600">Re-book allowed immediately</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-2">
        <Link href="/citizen/token" className="block w-full">
          <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md">
            <RefreshCw size={14} className="mr-1.5" /> Book a New Token
          </Button>
        </Link>
        <Link href="/citizen/help/contact" className="block w-full">
          <Button variant="ghost" className="w-full text-xs text-slate-500">
            Contact Help Desk
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function TokenNoShowPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading token details...</div>}>
      <TokenNoShowContent />
    </Suspense>
  );
}
