"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Volume2, ArrowRight, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSocket } from '@/lib/socketClient';

import { CitizenToken } from '@/types/citizen';

function TokenCalledContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenIdParam = searchParams ? searchParams.get('tokenId') : null;

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [tokenData, setTokenData] = useState<CitizenToken | null>(null);

  const fetchTokenState = useCallback(async () => {
    try {
      const url = tokenIdParam ? `/api/citizen/queue/${tokenIdParam}` : '/api/citizen/queue';
      const r = await fetch(url);
      const res = await r.json();
      if (res.success && res.data?.token) {
        const tok: CitizenToken = res.data.token;
        setTokenData(tok);
        if (tok.status === 'SERVING') {
          router.push(`/citizen/token-lifecycle/serving${tokenIdParam ? `?tokenId=${tokenIdParam}` : ''}`);
          return;
        }
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
        if (tok.callTime) {
          const timeoutSeconds = 300;
          const elapsedSeconds = Math.floor((Date.now() - new Date(tok.callTime).getTime()) / 1000);
          const remaining = Math.max(0, timeoutSeconds - elapsedSeconds);
          setTimeLeft(remaining);
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

    const handleServing = (data?: { tokenId?: string }) => {
      if (!tokenData?._id || data?.tokenId === tokenData._id) {
        router.push(`/citizen/token-lifecycle/serving${tokenIdParam ? `?tokenId=${tokenIdParam}` : ''}`);
      }
    };

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

    socket.on('token:serving', handleServing);
    socket.on('token:completed', handleCompleted);
    socket.on('token:cancelled', handleCancelled);
    socket.on('token:no_show', handleSkipped);
    socket.on('connect', handleSync);
    socket.on('queue:updated', handleSync);

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : prev));
    }, 1000);

    return () => {
      clearTimeout(syncTimer);
      clearInterval(timer);
      socket.off('token:serving', handleServing);
      socket.off('token:completed', handleCompleted);
      socket.off('token:cancelled', handleCancelled);
      socket.off('token:no_show', handleSkipped);
      socket.off('connect', handleSync);
      socket.off('queue:updated', handleSync);
    };
  }, [fetchTokenState, router, tokenData?._id, tokenIdParam]);

  const formatTimer = (seconds: number | null) => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const tokenNumber = tokenData?.tokenNumber || 'Data unavailable';
  const serviceName = tokenData?.serviceName || 'Data unavailable';
  const officeName = tokenData?.officeName || 'Data unavailable';
  const counterDisplay = tokenData?.counterName || (tokenData?.counterNumber ? `Counter ${tokenData.counterNumber}` : (tokenData ? 'Counter Assigned' : 'Data unavailable'));
  const calledAtDisplay = tokenData?.callTime ? new Date(tokenData.callTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null;

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-4 text-center">
      {/* High Alert Badge & Icon */}
      <div className="relative inline-block mx-auto">
        <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shadow-lg ring-8 ring-amber-400/20 animate-pulse">
          <Volume2 size={48} className="text-amber-600 animate-bounce" />
        </div>
      </div>

      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
          Screen 26 • Token Lifecycle
        </span>
        <h1 className="text-3xl font-black text-slate-900 mt-2">YOUR TOKEN IS CALLED!</h1>
        <p className="text-xs text-slate-500 mt-1">Please proceed directly to your assigned service counter now.</p>
      </div>

      {/* Target Counter Card */}
      <Card className="border-amber-300 bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white shadow-xl overflow-hidden">
        <CardContent className="p-6 text-center">
          <p className="text-xs uppercase tracking-widest text-amber-100 font-bold">TOKEN {tokenNumber}</p>
          <div className="my-3">
            <span className="text-xs font-semibold bg-white/20 backdrop-blur-md px-3 py-1 rounded-full uppercase">
              ASSIGNED COUNTER
            </span>
            <h2 className="text-4xl font-black tracking-tight my-2 uppercase">{counterDisplay}</h2>
            <p className="text-sm font-semibold text-amber-100">{serviceName} • {officeName}</p>
          </div>

          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/20 mt-4 space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-amber-100 font-semibold mb-1">
              Time Remaining to Report at Counter
            </p>
            <p className="text-4xl font-mono font-black tracking-widest text-white">
              {formatTimer(timeLeft)}
            </p>
            {calledAtDisplay && (
              <p className="text-[11px] text-amber-100/90 font-medium pt-2 border-t border-white/15 flex items-center justify-center gap-1">
                <Clock size={12} /> Called at: {calledAtDisplay}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="space-y-2">
        <Link href={`/citizen/token-lifecycle/serving${tokenIdParam ? `?tokenId=${tokenIdParam}` : ''}`} className="block w-full">
          <Button className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md">
            I Have Arrived at Counter <ArrowRight size={14} className="ml-1.5" />
          </Button>
        </Link>
        <Link href={`/citizen/queue/${tokenData?._id || tokenIdParam || ''}`} className="block w-full">
          <Button variant="ghost" className="w-full text-xs text-slate-500">
            View Live Queue Pass
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function TokenCalledPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading token call details...</div>}>
      <TokenCalledContent />
    </Suspense>
  );
}
