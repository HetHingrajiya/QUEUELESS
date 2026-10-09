"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, ArrowRight, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { EmptyState } from '@/components/common/EmptyState';
import { getSocket } from '@/lib/socketClient';
import { CitizenQueueSummary, ApiResponse } from '@/types/citizen';

export default function QueuePositionPage() {
  const [queueData, setQueueData] = useState<CitizenQueueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosition = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await fetch('/api/citizen/queue');
      const json: ApiResponse<CitizenQueueSummary> = await res.json();
      if (json.success && json.data) {
        setQueueData(json.data);
        setError(null);
      } else {
        setError(json.message || 'No active queue token found');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load position');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPosition(true);
    }, 0);

    const socket = getSocket();

    const handleUpdate = () => {
      fetchPosition(false);
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
        fetchPosition(false);
      }
    }, 10000);

    return () => {
      clearTimeout(timer);
      events.forEach(ev => socket.off(ev, handleUpdate));
      clearInterval(fallbackPoll);
    };
  }, [fetchPosition]);

  // Join token-specific and office-specific rooms when active token is loaded
  useEffect(() => {
    if (!queueData?.token?._id) return;

    const socket = getSocket();
    const tokenId = queueData.token._id;
    const officeId = typeof queueData.token.officeId === 'object' && queueData.token.officeId !== null 
      ? queueData.token.officeId._id 
      : queueData.token.officeId;

    socket.emit('join-token', tokenId);
    if (officeId) {
      socket.emit('join-office', officeId);
    }

    return () => {
      socket.emit('leave-token', tokenId);
      if (officeId) {
        socket.emit('leave-office', officeId);
      }
    };
  }, [queueData?.token?._id, queueData?.token?.officeId]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto pt-4">
        <SkeletonLoader type="queue" />
      </div>
    );
  }

  if (error || !queueData?.token) {
    return (
      <div className="max-w-md mx-auto pt-8">
        <EmptyState
          icon={<Users size={32} />}
          title="No Active Queue Position"
          description="You do not currently have a waiting token in any active line."
          actionText="Join a Queue"
          actionHref="/citizen/offices"
        />
      </div>
    );
  }

  const { token, nowServing, peopleAhead, estimatedWaitMin, nextTokens } = queueData;
  const position = peopleAhead + 1;

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Link href="/citizen/queue" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Screen 21 • Live Queue
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">Queue Position & Line</h1>
          </div>
        </div>
      </div>

      {/* Position Hero Card */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white shadow-lg overflow-hidden">
        <CardContent className="p-6 text-center">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-3 border border-white/20">
            Your Virtual Place
          </span>
          <div className="flex items-baseline justify-center space-x-2">
            <span className="text-6xl font-black tracking-tight">#{position}</span>
            <span className="text-blue-100 font-medium text-sm">in line</span>
          </div>
          <p className="text-blue-100 text-xs mt-2 font-medium">
            Token <strong className="text-white text-sm">{token.tokenNumber}</strong> • {token.serviceName}
          </p>
          <div className="flex justify-center items-center space-x-6 mt-4 pt-4 border-t border-white/20 text-xs">
            <div>
              <p className="text-blue-200 text-[10px] uppercase font-bold">People Ahead</p>
              <p className="text-xl font-black">{peopleAhead}</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div>
              <p className="text-blue-200 text-[10px] uppercase font-bold">Est. Wait</p>
              <p className="text-xl font-black">~{estimatedWaitMin}m</p>
            </div>
            {nowServing && (
              <>
                <div className="w-px h-8 bg-white/20" />
                <div>
                  <p className="text-blue-200 text-[10px] uppercase font-bold">Now Serving</p>
                  <p className="text-xl font-black">
                    {typeof nowServing === 'object' && nowServing !== null ? nowServing.tokenNumber : nowServing}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Real Queue Line Sequence */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center">
          <Activity size={14} className="mr-1.5 text-blue-600" />
          Live Queue Line Progression
        </h3>

        <div className="space-y-2">
          {/* Currently Serving */}
          {nowServing && (
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <div>
                  <p className="font-mono font-bold text-emerald-900 text-sm">
                    {typeof nowServing === 'object' && nowServing !== null ? nowServing.tokenNumber : nowServing}
                  </p>
                  <p className="text-[10px] text-emerald-700">Currently At Counter</p>
                </div>
              </div>
              <span className="bg-emerald-200 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                SERVING NOW
              </span>
            </div>
          )}

          {/* User's Token Card */}
          <div className="p-4 bg-blue-50/80 rounded-xl border-2 border-blue-500 flex items-center justify-between text-xs shadow-xs">
            <div className="flex items-center space-x-3">
              <span className="w-3 h-3 rounded-full bg-blue-600" />
              <div>
                <p className="font-mono font-black text-blue-900 text-base">{token.tokenNumber}</p>
                <p className="text-[11px] text-blue-700 font-semibold">Your Token ({position === 1 ? 'Next Up!' : `#${position} in line`})</p>
              </div>
            </div>
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
              YOUR TURN
            </span>
          </div>

          {/* Tokens following */}
          {nextTokens && nextTokens.length > 0 && nextTokens.map((item, idx: number) => {
            const num = typeof item === 'object' && item !== null ? item.tokenNumber : item;
            if (num === token.tokenNumber) return null;
            return (
              <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  <p className="font-mono font-bold text-slate-800">{num}</p>
                </div>
                <span className="text-slate-400 text-[11px]">In Queue Line</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <Link href={`/citizen/queue/${token._id}`} className="block">
        <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-sm">
          Open Live Tracker <ArrowRight size={14} className="ml-1" />
        </Button>
      </Link>
    </div>
  );
}
