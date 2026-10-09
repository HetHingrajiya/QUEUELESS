"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, QrCode, Download, Share2, 
  MapPin, Calendar, Building2 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { getSocket } from '@/lib/socketClient';
import { CitizenToken, ApiResponse, CitizenQueueSummary } from '@/types/citizen';

function DigitalTokenQRContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenIdParam = searchParams ? searchParams.get('tokenId') : null;

  const [tokenData, setTokenData] = useState<CitizenToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      // If specific tokenId given, fetch that
      if (tokenIdParam) {
        const res = await fetch(`/api/citizen/queue/${tokenIdParam}`);
        const json: ApiResponse<CitizenQueueSummary> = await res.json();
        if (json.success && json.data?.token) {
          setTokenData(json.data.token);
          return;
        }
      }

      // Otherwise fetch current active queue token
      const qRes = await fetch('/api/citizen/queue');
      const qJson: ApiResponse<CitizenQueueSummary> = await qRes.json();
      if (qJson.success && qJson.data?.token) {
        setTokenData(qJson.data.token);
        return;
      }

      // Fallback to active token list in my queue
      const myRes = await fetch('/api/citizen/queue/my');
      const myJson: ApiResponse<CitizenToken[]> = await myRes.json();
      if (myJson.success && myJson.data && myJson.data.length > 0) {
        setTokenData(myJson.data[0]);
        return;
      }

      setError('No active tokens found. Please generate a token first.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load token pass');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [tokenIdParam]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchToken(true);
    }, 0);

    const socket = getSocket();

    const handleUpdate = () => {
      fetchToken(false);
    };

    const events = [
      'queue:updated', 'QUEUE_UPDATED',
      'queue:action', 'QUEUE_ACTION',
      'token:called', 'TOKEN_CALLED',
      'token:checked_in', 'TOKEN_CHECKED_IN',
      'token:serving', 'TOKEN_SERVICE_STARTED',
      'token:completed', 'TOKEN_SERVICE_COMPLETED',
      'token:cancelled', 'TOKEN_CANCELLED',
      'token:no_show', 'TOKEN_SKIPPED',
      'counter:updated', 'COUNTER_UPDATED',
      'connect'
    ];
    events.forEach(ev => socket.on(ev, handleUpdate));

    const fallbackPoll = setInterval(() => {
      if (!socket.connected) {
        fetchToken(false);
      }
    }, 10000);

    return () => {
      clearTimeout(timer);
      events.forEach(ev => socket.off(ev, handleUpdate));
      clearInterval(fallbackPoll);
    };
  }, [fetchToken]);

  useEffect(() => {
    if (!tokenData?._id) return;
    const socket = getSocket();
    const tokenId = tokenData._id;
    socket.emit('join-token', tokenId);
    return () => {
      socket.emit('leave-token', tokenId);
    };
  }, [tokenData?._id]);

  const handleDownload = () => {
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto pt-4">
        <SkeletonLoader type="queue" />
      </div>
    );
  }

  if (error || !tokenData) {
    return (
      <div className="max-w-md mx-auto pt-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <QrCode size={32} />
        </div>
        <p className="text-slate-600 text-sm font-medium">{error || 'No active token pass available'}</p>
        <Link href="/citizen/token">
          <Button className="bg-blue-600 hover:bg-blue-700 text-xs font-bold">
            Get Virtual Token
          </Button>
        </Link>
      </div>
    );
  }

  const tokenNumber = tokenData.tokenNumber || 'Data unavailable';
  const serviceName = tokenData.serviceName || (typeof tokenData.serviceId === 'object' && tokenData.serviceId !== null ? tokenData.serviceId.name : 'Data unavailable');
  const officeName = tokenData.officeName || (typeof tokenData.officeId === 'object' && tokenData.officeId !== null ? tokenData.officeId.name : 'Data unavailable');
  const address = tokenData.address || (typeof tokenData.officeId === 'object' && tokenData.officeId !== null && 'address' in tokenData.officeId ? (tokenData.officeId as { address: string }).address : 'Data unavailable');
  const status = tokenData.status || 'Data unavailable';

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <button 
            onClick={() => router.back()}
            className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Screen 18 • Digital Token Pass
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">Digital QR Pass</h1>
          </div>
        </div>
      </div>

      {/* Main Digital Pass Card */}
      <Card className="border-slate-200 overflow-hidden shadow-lg bg-white">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-5 text-white text-center relative">
          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full text-blue-100">
            OFFICIAL DIGITAL CITIZEN PASS
          </span>
          <h2 className="text-4xl font-black mt-2 tracking-tight">{tokenNumber}</h2>
          <p className="text-xs text-blue-100 mt-1 font-medium">{serviceName}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            {status}
          </div>
        </div>

        <CardContent className="p-6 space-y-5 text-center">
          {/* QR Code Container */}
          <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200 inline-block shadow-inner">
            <div className="w-48 h-48 bg-white p-3 rounded-xl shadow-xs border border-slate-100 flex flex-col items-center justify-center">
              <QrCode size={140} className="text-slate-800" />
              <p className="font-mono text-[9px] text-slate-400 mt-2 font-bold tracking-widest">
                PASS: {tokenData._id || 'QL-TOKEN'}
              </p>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 font-medium">
              Scan at office entrance kiosk for instant check-in
            </p>
          </div>

          {/* Details Grid */}
          <div className="space-y-2 text-xs text-left bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center">
                <Building2 size={13} className="mr-1.5 text-blue-500" /> Office:
              </span>
              <span className="font-bold text-slate-800 text-right truncate max-w-[200px]">{officeName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center">
                <MapPin size={13} className="mr-1.5 text-emerald-500" /> Address:
              </span>
              <span className="text-slate-600 text-right truncate max-w-[200px]">{address}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center">
                <Calendar size={13} className="mr-1.5 text-indigo-500" /> Generated:
              </span>
              <span className="font-medium text-slate-700">
                {tokenData.createdAt ? new Date(tokenData.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : 'Today'}
              </span>
            </div>
          </div>

          {/* Download & Share Actions */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button
              onClick={handleDownload}
              variant="outline"
              className="h-11 text-xs font-bold border-slate-200 hover:bg-slate-50"
            >
              <Download size={14} className="mr-1.5" /> {downloaded ? 'Pass Saved!' : 'Save Image'}
            </Button>
            <Button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: `QueueLess Token ${tokenNumber}`, text: `My virtual token ${tokenNumber} for ${serviceName}`, url: window.location.href });
                } else {
                  alert('Token pass link copied to clipboard!');
                }
              }}
              variant="outline"
              className="h-11 text-xs font-bold border-slate-200 hover:bg-slate-50"
            >
              <Share2 size={14} className="mr-1.5" /> Share Pass
            </Button>
          </div>

          <Link href={`/citizen/queue/${tokenData._id || tokenData.id || ''}`} className="block">
            <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md">
              View Live Queue Monitor
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DigitalTokenQRPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading token pass...</div>}>
      <DigitalTokenQRContent />
    </Suspense>
  );
}
