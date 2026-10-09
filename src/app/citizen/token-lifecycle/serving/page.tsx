"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activity, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSocket } from '@/lib/socketClient';

import { CitizenToken } from '@/types/citizen';

function ServiceStartedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenIdParam = searchParams ? searchParams.get('tokenId') : null;

  const [elapsedSec, setElapsedSec] = useState<number | null>(null);
  const [tokenData, setTokenData] = useState<CitizenToken | null>(null);

  const fetchTokenState = useCallback(async () => {
    try {
      const url = tokenIdParam ? `/api/citizen/queue/${tokenIdParam}` : '/api/citizen/queue';
      const r = await fetch(url);
      const res = await r.json();
      if (res.success && res.data?.token) {
        const tok: CitizenToken = res.data.token;
        setTokenData(tok);
        if (tok.status === 'COMPLETED') {
          router.push(`/citizen/token-lifecycle/completed${tokenIdParam ? `?tokenId=${tokenIdParam}` : ''}`);
          return;
        }
        if (tok.status === 'CANCELLED') {
          router.push(`/citizen/token-lifecycle/cancelled${tokenIdParam ? `?tokenId=${tokenIdParam}` : ''}`);
          return;
        }
        if (tok.status === 'NO_SHOW' || tok.status === 'SKIPPED') {
          router.push(`/citizen/token-lifecycle/no-show${tokenIdParam ? `?tokenId=${tokenIdParam}` : ''}`);
          return;
        }
        const startTimestamp = tok.startTime || tok.callTime;
        if (startTimestamp) {
          const elapsed = Math.max(0, Math.floor((Date.now() - new Date(startTimestamp).getTime()) / 1000));
          setElapsedSec(elapsed);
        }
      }
    } catch {
      // ignore
    }
  }, [router, tokenIdParam]);

  useEffect(() => {
    const syncTimer = setTimeout(() => {
      fetchTokenState();
    }, 0);

    const socket = getSocket();

    const handleCompleted = (data?: { tokenId?: string }) => {
      if (!tokenData?._id || data?.tokenId === tokenData._id) {
        router.push(`/citizen/token-lifecycle/completed${tokenIdParam ? `?tokenId=${tokenIdParam}` : ''}`);
      }
    };

    const handleCancelled = (data?: { tokenId?: string }) => {
      if (!tokenData?._id || data?.tokenId === tokenData._id) {
        router.push(`/citizen/token-lifecycle/cancelled${tokenIdParam ? `?tokenId=${tokenIdParam}` : ''}`);
      }
    };

    const handleSkipped = (data?: { tokenId?: string }) => {
      if (!tokenData?._id || data?.tokenId === tokenData._id) {
        router.push(`/citizen/token-lifecycle/no-show${tokenIdParam ? `?tokenId=${tokenIdParam}` : ''}`);
      }
    };

    const handleSync = () => {
      fetchTokenState();
    };

    socket.on('token:completed', handleCompleted);
    socket.on('token:cancelled', handleCancelled);
    socket.on('token:no_show', handleSkipped);
    socket.on('connect', handleSync);
    socket.on('queue:updated', handleSync);

    const timer = setInterval(() => {
      setElapsedSec(prev => (prev !== null ? prev + 1 : prev));
    }, 1000);

    return () => {
      clearTimeout(syncTimer);
      clearInterval(timer);
      socket.off('token:completed', handleCompleted);
      socket.off('token:cancelled', handleCancelled);
      socket.off('token:no_show', handleSkipped);
      socket.off('connect', handleSync);
      socket.off('queue:updated', handleSync);
    };
  }, [fetchTokenState, router, tokenData?._id, tokenIdParam]);

  const formatElapsed = (sec: number | null) => {
    if (sec === null) return '--:--';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const tokenNumber = tokenData?.tokenNumber || 'Data unavailable';
  const serviceName = tokenData?.serviceName || 'Data unavailable';
  const officeName = tokenData?.officeName || 'Data unavailable';
  const counterDisplay = tokenData?.counterName || (tokenData?.counterNumber ? `Counter ${tokenData.counterNumber}` : 'Counter Assigned');
  const startedAtDisplay = tokenData?.startTime ? new Date(tokenData.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null;

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-4 text-center">
      {/* Active Pulse Animation */}
      <div className="relative inline-block mx-auto">
        <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-lg ring-8 ring-blue-400/20">
          <Activity size={48} className="text-blue-600 animate-pulse" />
        </div>
      </div>

      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          Screen 27 • Token Lifecycle
        </span>
        <h1 className="text-2xl font-black text-slate-900 mt-2">Service In Progress</h1>
        <p className="text-xs text-slate-500 mt-1">
          {serviceName !== 'Data unavailable' 
            ? `Your request for ${serviceName} is currently being processed.`
            : 'Your request is currently being processed at the counter.'}
        </p>
      </div>

      {/* Active Session Card */}
      <Card className="border-blue-200 bg-white shadow-md text-left overflow-hidden">
        <CardContent className="p-5 space-y-4">
          <div className="flex justify-between items-start border-b border-slate-100 pb-3">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">SESSION TOKEN</p>
              <h2 className="text-2xl font-black text-slate-900">{tokenNumber}</h2>
              <p className="text-xs text-slate-500">{officeName}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full uppercase">
                {tokenData?.status || 'SERVING'}
              </span>
              <p className="text-xs font-mono font-bold text-slate-700 mt-1 flex items-center justify-end">
                <Clock size={11} className="mr-1 text-blue-600" /> {formatElapsed(elapsedSec)}
              </p>
            </div>
          </div>

          {/* Operational Status */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Counter Allocation
            </h4>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Assigned Counter:</span>
                <span className="font-bold text-slate-800">{counterDisplay}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Service:</span>
                <span className="font-semibold text-slate-700">{serviceName}</span>
              </div>
              {startedAtDisplay && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Started At:</span>
                  <span className="font-medium text-slate-800">{startedAtDisplay}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Processing State:</span>
                <span className="font-bold text-blue-600 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mr-1.5" /> Active with Officer
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="space-y-2">
        <Link href={`/citizen/token-lifecycle/completed${tokenIdParam ? `?tokenId=${tokenIdParam}` : ''}`} className="block w-full">
          <Button className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md">
            View Service Completion <ArrowRight size={14} className="ml-1.5" />
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

export default function ServiceStartedPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading service details...</div>}>
      <ServiceStartedContent />
    </Suspense>
  );
}
