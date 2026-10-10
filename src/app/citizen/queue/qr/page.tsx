"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, Ticket, Printer, Share2, Copy, 
  MapPin, Calendar, Building2 
} from 'lucide-react';
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
        const res = await fetch(`/api/citizen/queue/${encodeURIComponent(tokenIdParam)}`, { cache: 'no-store' });
        const json: ApiResponse<CitizenQueueSummary> = await res.json();
        if (res.ok && json.success && json.data?.token) {
          setTokenData(json.data.token);
          setError(null);
        } else {
          setTokenData(null);
          setError(json.message || 'The requested token could not be found or is not available to this account.');
        }
        return;
      }

      // No token ID was supplied: find a current active token.
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
    const passText = `SamaySetu Token ${tokenNumber}\nService: ${serviceName}\nOffice: ${officeName}\nToken reference: ${tokenData?._id || ''}\n${window.location.href}`;
    setShareMessage('');
    try {
      if (navigator.share) {
        await navigator.share({ title: `SamaySetu Token ${tokenNumber}`, text: passText, url: window.location.href });
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
      <div className="max-w-md mx-auto pt-16 text-center space-y-6">
        <div className="w-24 h-24 rounded-3xl bg-background shadow-neu-inset flex items-center justify-center mx-auto text-muted-foreground">
          <Ticket size={40} />
        </div>
        <p className="text-foreground font-black text-lg">{error || 'No active token pass available'}</p>
        <Link href="/citizen/token">
          <button className="px-6 py-3 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset text-primary font-black rounded-xl transition-all uppercase tracking-widest text-xs">
            Get Virtual Token
          </button>
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
    <div className="space-y-6 pb-20 max-w-6xl mx-auto pt-4 px-2 sm:px-6 cursor-default">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center">
          <button 
            onClick={() => router.back()}
            className="w-12 h-12 mr-4 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-full transition-all text-muted-foreground hover:text-foreground shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">Digital Token Pass</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Main Digital Pass Card */}
        <div className="lg:col-span-5">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-10 text-center border-0 relative overflow-hidden transition-all hover:shadow-neu-hover h-full flex flex-col justify-center">
            
            <p className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Official Citizen Pass</p>
            
            <div className="w-full max-w-[240px] mx-auto bg-background shadow-neu-inset rounded-[2rem] py-8 my-8">
               <p className="text-7xl font-black text-primary tracking-tighter drop-shadow-sm">{tokenNumber}</p>
            </div>
            
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest bg-background shadow-neu-inset text-foreground mb-6 mx-auto">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              {status}
            </div>

            <p className="text-base font-black text-foreground leading-snug">{serviceName}</p>
          </div>
        </div>

        {/* Right Column: Details and Actions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Digital Reference Box */}
          <div className="bg-background shadow-neu p-8 rounded-3xl text-center border-0">
            <div className="w-20 h-20 bg-background shadow-neu-inset text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Ticket size={32} />
            </div>
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Digital Reference</p>
            <div className="bg-background shadow-neu-inset px-5 py-4 rounded-xl mb-6 max-w-sm mx-auto">
              <p className="font-mono text-xs font-bold text-foreground break-all">{tokenData._id}</p>
            </div>
            <button 
              type="button" 
              className="px-6 py-3 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl text-xs uppercase font-black tracking-widest text-primary flex items-center justify-center mx-auto transition-all" 
              onClick={handleCopyReference}
            >
              <Copy size={16} className="mr-2" /> Copy Reference
            </button>
            <p className="text-xs font-semibold text-muted-foreground mt-6 leading-relaxed max-w-sm mx-auto">
              Show your token number at reception or use Venue Check-In. (QR functionality pending).
            </p>
          </div>

          {/* Details Grid */}
          <div className="space-y-5 text-sm text-left bg-background shadow-neu-inset p-8 rounded-3xl border-0">
            <div className="flex justify-between items-center border-b border-muted/10 pb-4">
              <span className="font-black text-muted-foreground uppercase tracking-widest text-xs flex items-center">
                <Building2 size={16} className="mr-3 text-primary" /> Office
              </span>
              <span className="font-black text-foreground text-right truncate max-w-[220px]">{officeName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-muted/10 pb-4">
              <span className="font-black text-muted-foreground uppercase tracking-widest text-xs flex items-center">
                <MapPin size={16} className="mr-3 text-primary" /> Address
              </span>
              <span className="font-bold text-foreground text-right truncate max-w-[220px]">{address}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-black text-muted-foreground uppercase tracking-widest text-xs flex items-center">
                <Calendar size={16} className="mr-3 text-primary" /> Generated
              </span>
              <span className="font-bold text-foreground">
                {tokenData.createdAt ? new Date(tokenData.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : 'Today'}
              </span>
            </div>
          </div>

          {/* Real browser print and share actions */}
          <div className="grid grid-cols-2 gap-6">
            <button 
              onClick={handlePrint} 
              className="h-14 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl text-xs uppercase font-black tracking-widest text-foreground flex items-center justify-center transition-all"
            >
              <Printer size={18} className="mr-3 text-muted-foreground" /> Print PDF
            </button>
            <button 
              onClick={handleShare} 
              className="h-14 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl text-xs uppercase font-black tracking-widest text-primary flex items-center justify-center transition-all"
            >
              <Share2 size={18} className="mr-3" /> Share Pass
            </button>
          </div>
          {shareMessage && <p role="status" className="text-xs font-black uppercase tracking-widest text-primary text-center bg-background shadow-neu-inset py-3 rounded-lg">{shareMessage}</p>}

          <Link href={`/citizen/queue/${tokenData._id || tokenData.id || ''}`} className="block mt-8">
            <button className="w-full h-16 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset text-primary font-black uppercase tracking-widest text-sm rounded-xl transition-all">
              View Live Queue Monitor
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DigitalTokenQRPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-black uppercase tracking-widest text-muted-foreground text-xs">Loading token pass...</div>}>
      <DigitalTokenQRContent />
    </Suspense>
  );
}
