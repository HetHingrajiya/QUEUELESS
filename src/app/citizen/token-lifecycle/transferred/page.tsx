"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  ArrowRightLeft, ArrowRight, Clock 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { EmptyState } from '@/components/common/EmptyState';
import { CitizenQueueSummary, ApiResponse } from '@/types/citizen';

function TokenTransferredContent() {
  const searchParams = useSearchParams();
  const tokenIdParam = searchParams ? searchParams.get('tokenId') : null;

  const [queueData, setQueueData] = useState<CitizenQueueSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransferData = async () => {
      try {
        setLoading(true);
        const url = tokenIdParam ? `/api/citizen/queue/${tokenIdParam}` : '/api/citizen/queue';
        const res = await fetch(url);
        const json: ApiResponse<CitizenQueueSummary> = await res.json();
        if (json.success && json.data) {
          setQueueData(json.data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchTransferData();
  }, [tokenIdParam]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto pt-6">
        <SkeletonLoader type="queue" />
      </div>
    );
  }

  const tokenData = queueData?.token;
  const transferDetails = queueData?.transferDetails || tokenData?.transferDetails;

  // If no token exists or no transfer event on record, show proper unavailable state
  if (!tokenData || !transferDetails) {
    return (
      <div className="space-y-6 pb-20 max-w-md mx-auto pt-8 text-center">
        <EmptyState
          icon={<ArrowRightLeft size={36} className="text-slate-400" />}
          title="No Transfer on Record"
          description={
            tokenData
              ? `Token ${tokenData.tokenNumber} is currently assigned to ${tokenData.counterName || (tokenData.counterNumber ? `Counter ${tokenData.counterNumber}` : 'its assigned counter')} and has not been transferred.`
              : "You do not currently have an active transferred queue ticket."
          }
          actionText="View Active Queue Pass"
          actionHref={tokenData?._id ? `/citizen/queue/${tokenData._id}` : "/citizen/queue"}
        />
        <div className="pt-2">
          <Link href="/citizen/home" className="inline-block">
            <Button variant="ghost" className="text-xs text-slate-500">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const tokenNumber = tokenData.tokenNumber || 'Data unavailable';
  const serviceName = tokenData.serviceName || 'Data unavailable';
  const officeName = tokenData.officeName || 'Data unavailable';
  const previousCounter = transferDetails.previousCounterName || 'Previous Counter';
  const newCounter = transferDetails.newCounterName || tokenData.counterName || 'New Assigned Counter';
  const transferTimestamp = transferDetails.transferTime;

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-4 text-center">
      {/* Transfer Animated Graphic */}
      <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shadow-lg mx-auto ring-8 ring-indigo-400/20">
        <ArrowRightLeft size={48} className="text-indigo-600 animate-pulse" />
      </div>

      <div>
<h1 className="text-2xl font-black text-slate-900 mt-2">Token Transferred</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          Your request for {serviceName} has been routed to a specialized service desk.
        </p>
      </div>

      {/* Transfer Routing Box */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-700 via-blue-700 to-slate-900 text-white shadow-xl overflow-hidden text-left">
        <CardContent className="p-6">
          <p className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">TRANSFER ASSIGNMENT</p>
          <div className="my-3 flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-xs text-indigo-200">Previous Station</p>
              <p className="text-sm font-semibold">{previousCounter}</p>
            </div>
            <ArrowRight size={20} className="text-indigo-300" />
            <div className="text-right">
              <p className="text-xs text-indigo-200">New Station</p>
              <p className="text-base font-black text-emerald-300">{newCounter}</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-indigo-100">
            <div className="flex justify-between">
              <span>Token:</span>
              <span className="font-bold text-white font-mono">{tokenNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Office:</span>
              <span className="font-semibold text-white">{officeName}</span>
            </div>
            {transferTimestamp && (
              <div className="flex justify-between">
                <span>Transfer Time:</span>
                <span className="font-medium text-indigo-200 flex items-center gap-1">
                  <Clock size={11} /> {new Date(transferTimestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Queue Priority:</span>
              <span className="font-bold text-emerald-300">Retained</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="space-y-2">
        <Link href={`/citizen/queue/${tokenData._id || tokenIdParam || ''}`} className="block w-full">
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

export default function TokenTransferredPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading transfer details...</div>}>
      <TokenTransferredContent />
    </Suspense>
  );
}
