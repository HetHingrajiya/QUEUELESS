"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { XCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CitizenToken, ApiResponse, CitizenQueueSummary } from '@/types/citizen';

function TokenCancelledContent() {
  const searchParams = useSearchParams();
  const tokenIdParam = searchParams ? searchParams.get('tokenId') : null;

  const [tokenData, setTokenData] = useState<CitizenToken | null>(null);

  useEffect(() => {
    const fetchCancelledToken = async () => {
      try {
        if (tokenIdParam) {
          const res = await fetch(`/api/citizen/queue/${tokenIdParam}`);
          const json: ApiResponse<CitizenQueueSummary> = await res.json();
          if (json.success && json.data?.token) {
            setTokenData(json.data.token);
            return;
          }
        }

        const histRes = await fetch('/api/citizen/token-history?status=CANCELLED');
        const histJson: ApiResponse<CitizenToken[]> = await histRes.json();
        if (histJson.success && histJson.data && histJson.data.length > 0) {
          setTokenData(histJson.data[0]);
        }
      } catch {
        // ignore
      }
    };

    fetchCancelledToken();
  }, [tokenIdParam]);

  const tokenNumber = tokenData?.tokenNumber || 'Data unavailable';
  const serviceName = tokenData?.serviceName || 'Data unavailable';
  const officeName = tokenData?.officeName || 'Data unavailable';
  const reason = tokenData?.cancellationReason || tokenData?.notes || 'Citizen voluntary cancellation';
  const cancelledAt = tokenData?.cancelledAt || tokenData?.updatedAt || tokenData?.endTime;

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-6 text-center">
      {/* Cancellation Icon Graphic */}
      <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-lg mx-auto ring-8 ring-red-400/20">
        <XCircle size={56} className="text-red-600" />
      </div>

      <div>
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
              <span className="text-slate-400">Cancellation Reason:</span>
              <span className="font-medium text-slate-800 text-right max-w-[200px]">{reason}</span>
            </div>
            {cancelledAt && (
              <div className="flex justify-between">
                <span className="text-slate-400">Cancelled At:</span>
                <span className="font-medium text-slate-800">
                  {new Date(cancelledAt).toLocaleString(undefined, { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            )}
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

export default function TokenCancelledPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading cancellation details...</div>}>
      <TokenCancelledContent />
    </Suspense>
  );
}
