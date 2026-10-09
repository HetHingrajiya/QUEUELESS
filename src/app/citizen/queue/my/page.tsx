"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Clock, Users, Building2, QrCode, 
  ArrowRight, RefreshCw, XCircle 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
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
      if (json.success) {
        setActiveQueues(prev => prev.filter(t => t.id !== tokenId && t._id !== tokenId));
      } else {
        setError(json.message || 'Failed to cancel token');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to cancel token');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Link href="/citizen/home" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
<h1 className="text-xl font-bold text-slate-900 mt-0.5">My Active Queues</h1>
          </div>
        </div>
        <button
          onClick={() => fetchActiveQueues(true)}
          className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
          title="Refresh Queue"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <SkeletonLoader type="queue" count={2} />
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          {error}
        </div>
      ) : activeQueues.length === 0 ? (
        <EmptyState
          icon={<Users size={32} />}
          title="No Active Queues"
          description="You don't currently have any active tokens waiting or being served."
          actionText="Get a New Token"
          actionHref="/citizen/offices"
        />
      ) : (
        <div className="space-y-4">
          {activeQueues.map((item) => {
            const tokenId = item.id || item._id;
            return (
              <Card key={tokenId} className="border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
                <div className={`h-2 ${item.status === 'CHECKED_IN' ? 'bg-emerald-500' : item.status === 'CALLED' ? 'bg-amber-500' : 'bg-blue-600'}`} />
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0 pr-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        item.status === 'CHECKED_IN'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : item.status === 'CALLED'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {item.status.replace('_', ' ')}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base mt-1.5 truncate">{item.serviceName}</h3>
                      <p className="text-xs text-slate-500 flex items-center mt-0.5 truncate">
                        <Building2 size={13} className="mr-1 text-slate-400 shrink-0" />
                        <span className="truncate">{item.officeName}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-slate-400 uppercase">Token</p>
                      <p className="text-3xl font-black text-slate-900 tracking-tight">{item.tokenNumber}</p>
                    </div>
                  </div>

                  {/* Live Metric Badges */}
                  <div className="grid grid-cols-2 gap-3 my-4">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Users size={18} />
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 font-medium">People Ahead</p>
                        <p className="text-lg font-bold text-slate-900">{item.peopleAhead}</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                        <Clock size={18} />
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 font-medium">Est. Wait</p>
                        <p className="text-lg font-bold text-amber-600">~{item.estimatedWaitMin}m</p>
                      </div>
                    </div>
                  </div>

                  {/* Currently Serving */}
                  {item.nowServing && (
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs mb-4">
                      <span className="text-slate-500">Currently Serving:</span>
                      <span className="font-bold text-slate-800 font-mono">{item.nowServing}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Link href={`/citizen/queue/${tokenId}`} className="flex-1">
                      <Button className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-xs font-bold">
                        Live Monitor <ArrowRight size={13} className="ml-1" />
                      </Button>
                    </Link>
                    <Link href={`/citizen/token/qr?tokenId=${tokenId}`}>
                      <Button variant="outline" className="h-10 px-3 text-xs" title="Digital QR">
                        <QrCode size={16} />
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      onClick={(e) => handleCancelToken(tokenId, e)}
                      disabled={cancellingId === tokenId}
                      className="h-10 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50" 
                      title="Cancel Token"
                    >
                      <XCircle size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
