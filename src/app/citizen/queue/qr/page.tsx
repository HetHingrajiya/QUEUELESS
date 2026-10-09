"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, Ticket, Printer, Share2, Copy, 
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
  const [shareMessage, setShareMessage] = useState('');
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

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  const handleShare = async () => {
    const passText = `QueueLess Token ${tokenNumber}\nService: ${serviceName}\nOffice: ${officeName}\nToken reference: ${tokenData?._id || ''}\n${window.location.href}`;
    setShareMessage('');
    try {
      if (navigator.share) {
        await navigator.share({ title: `QueueLess Token ${tokenNumber}`, text: passText, url: window.location.href });
        setShareMessage('Pass shared.');
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(passText);
        setShareMessage('Token details copied to clipboard.');
      } else {
        setShareMessage('Sharing is not supported in this browser.');
      }
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name === 'AbortError') return;
      setShareMessage('Unable to share the pass from this browser.');
    }
  };

  const handleCopyReference = async () => {
    try {
      await navigator.clipboard.writeText(tokenData?._id || '');
      setShareMessage('Token reference copied.');
    } catch {
      setShareMessage('Clipboard access is unavailable in this browser.');
    }
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
          <Ticket size={32} />
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
<h1 className="text-xl font-bold text-slate-900 mt-0.5">Digital Token Pass</h1>
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
          {/* Digital reference only: this is not a scannable QR code. */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mx-auto">
              <Ticket size={30} />
            </div>
            <p className="text-xs font-semibold text-slate-700 mt-3">Digital token reference</p>
            <p className="font-mono text-[11px] text-slate-600 mt-2 break-all">{tokenData._id}</p>
            <Button type="button" variant="outline" className="mt-3 h-9 text-xs" onClick={handleCopyReference}>
              <Copy size={14} className="mr-1.5" /> Copy reference
            </Button>
            <p className="text-[11px] text-slate-500 mt-3">
              This screen does not currently generate a scannable QR. Show your token number at reception or use Venue Check-In.
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

          {/* Real browser print and share actions */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button onClick={handlePrint} variant="outline" className="h-11 text-xs font-bold border-slate-200 hover:bg-slate-50">
              <Printer size={14} className="mr-1.5" /> Print / Save PDF
            </Button>
            <Button onClick={handleShare} variant="outline" className="h-11 text-xs font-bold border-slate-200 hover:bg-slate-50">
              <Share2 size={14} className="mr-1.5" /> Share Pass
            </Button>
          </div>
          {shareMessage && <p role="status" className="text-xs text-blue-700 text-center">{shareMessage}</p>}

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
