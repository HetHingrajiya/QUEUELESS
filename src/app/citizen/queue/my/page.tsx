"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Clock, Users, Building2, QrCode, 
  ArrowRight, RefreshCw, XCircle 
} from 'lucide-react';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { getSocket } from '@/lib/socketClient';
import { CitizenToken, ApiResponse } from '@/types/citizen';

export default function MyQueuePage() {
  const [activeQueues, setActiveQueues] = useState<CitizenToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveQueues = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      setError(null);
      const res = await fetch('/api/citizen/queue/my');
      const json: ApiResponse<CitizenToken[]> = await res.json();
      if (json.success && json.data) {
        setActiveQueues(json.data);
      } else {
        setError(json.message || 'Failed to fetch active queues');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchActiveQueues(true);
    }, 0);

    const socket = getSocket();

    const handleUpdate = () => {
      fetchActiveQueues(false);
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
        fetchActiveQueues(false);
      }
    }, 10000);

    return () => {
      clearTimeout(timer);
      events.forEach(ev => socket.off(ev, handleUpdate));
      clearInterval(fallbackPoll);
    };
  }, [fetchActiveQueues]);

  const handleCancelToken = async (tokenId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to cancel this active queue token?')) return;

    try {
      setCancellingId(tokenId);
      const res = await fetch('/api/citizen/token/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId, reason: 'Cancelled by citizen from My Queue' })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setActiveQueues(prev => prev.filter(t => t.id !== tokenId && t._id !== tokenId));
      } else {
        const message = json.message || 'Failed to cancel token';
        await fetchActiveQueues(false);
        setError(message);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to cancel token');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-4 cursor-default">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center">
          <Link href="/citizen/home" className="w-10 h-10 mr-4 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-full transition-all text-muted-foreground hover:text-foreground shrink-0">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-black text-foreground tracking-tight">My Active Queues</h1>
        </div>
        <button
          onClick={() => fetchActiveQueues(true)}
          className="w-10 h-10 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-full transition-all text-primary shrink-0"
          title="Refresh Queue"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <LoadingState label="Loading your active queues…" />
      ) : error ? (
        <ErrorState title="Could not load your queues" description={error} onRetry={() => fetchActiveQueues(true)} />
      ) : activeQueues.length === 0 ? (
        <EmptyState
          icon={<Users size={48} className="text-primary/50" />}
          title="No Active Queues"
          description="You don't currently have any active tokens waiting or being served."
          actionText="Get a New Token"
          actionHref="/citizen/offices"
        />
      ) : (
        <div className="space-y-6 px-1">
          {activeQueues.map((item) => {
            const tokenId = item.id || item._id;
            return (
              <div key={tokenId} className="bg-background shadow-neu rounded-3xl p-6 border-0 overflow-hidden transition-all hover:shadow-neu-hover">
                {/* Header Row: Info & Token Num */}
                <div className="flex justify-between items-start mb-6">
                  <div className="min-w-0 pr-4">
                    <div className="inline-block bg-background shadow-neu-inset px-2.5 py-1 rounded-full mb-3">
                      <StatusBadge status={item.status || 'UNKNOWN'} />
                    </div>
                    <h3 className="font-extrabold text-foreground text-lg leading-tight truncate">{item.serviceName}</h3>
                    <p className="text-xs font-semibold text-muted-foreground flex items-center mt-1.5 truncate">
                      <Building2 size={14} className="mr-1.5 shrink-0" />
                      <span className="truncate">{item.officeName}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Token</p>
                    <div className="bg-background shadow-neu-inset px-4 py-2 rounded-2xl">
                      <p className="text-3xl font-black text-primary tracking-tighter">{item.tokenNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Live Metric Badges */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="bg-background shadow-neu-inset rounded-2xl p-4 flex items-center space-x-3 border-0">
                    <div className="w-10 h-10 rounded-xl bg-background shadow-neu text-primary flex items-center justify-center shrink-0">
                      <Users size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Ahead</p>
                      <p className="text-xl font-black text-foreground mt-0.5">{item.peopleAhead}</p>
                    </div>
                  </div>

                  <div className="bg-background shadow-neu-inset rounded-2xl p-4 flex items-center space-x-3 border-0">
                    <div className="w-10 h-10 rounded-xl bg-background shadow-neu text-primary flex items-center justify-center shrink-0">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Wait</p>
                      <p className="text-xl font-black text-foreground mt-0.5">{item.estimatedWaitMin}<span className="text-xs ml-1">m</span></p>
                    </div>
                  </div>
                </div>

                {/* Currently Serving */}
                {item.nowServing && (
                  <div className="bg-background shadow-neu-inset p-4 rounded-2xl flex items-center justify-between text-xs mb-6 border-0">
                    <span className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Currently Serving:</span>
                    <span className="font-black text-foreground font-mono bg-background shadow-neu px-3 py-1.5 rounded-lg">{item.nowServing}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-6 border-t border-muted/10">
                  <Link href={`/citizen/queue/${tokenId}`} className="flex-1">
                    <button className="w-full h-12 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset text-primary font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center">
                      Live Monitor <ArrowRight size={14} className="ml-2" />
                    </button>
                  </Link>
                  <Link href={`/citizen/token/qr?tokenId=${tokenId}`}>
                    <button className="w-12 h-12 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset text-foreground rounded-xl transition-all" title="Digital QR">
                      <QrCode size={18} />
                    </button>
                  </Link>
                  <button 
                    onClick={(e) => handleCancelToken(tokenId, e)}
                    disabled={cancellingId === tokenId}
                    className="w-12 h-12 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset text-red-500 rounded-xl transition-all disabled:opacity-50" 
                    title="Cancel Token"
                  >
                    <XCircle size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
