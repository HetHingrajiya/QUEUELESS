"use client";
import { useEffect, useState, useCallback, use } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, Clock, Users, Activity, Loader2, Sparkles, 
  AlertCircle, CheckCircle2, Megaphone, Bell, RotateCcw, 
  Wifi, WifiOff, MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socketClient';
import { CitizenQueueSummary, ApiResponse } from '@/types/citizen';

type ConnectionStatus = 'CONNECTING' | 'LIVE' | 'RECONNECTING' | 'OFFLINE';

export default function CitizenLiveQueue({ params }: { params: Promise<{ tokenId: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const tokenId = unwrappedParams.tokenId;
  
  const [data, setData] = useState<CitizenQueueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('CONNECTING');

  const fetchQueueData = useCallback(async () => {
    try {
      const res = await fetch(`/api/citizen/queue/${tokenId}`);
      const json: ApiResponse<CitizenQueueSummary> = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (e: unknown) {
      console.error('Queue data fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [tokenId]);

  useEffect(() => {
    const timer = setTimeout(() => fetchQueueData(), 0);
    
    const socket = getSocket();
    socket.emit('join-token', tokenId);

    const onConnect = () => {
      setConnectionStatus('LIVE');
      fetchQueueData();
    };

    const onDisconnect = () => {
      setConnectionStatus('OFFLINE');
    };

    const onReconnectAttempt = () => {
      setConnectionStatus('RECONNECTING');
    };

    const onReconnect = () => {
      setConnectionStatus('LIVE');
      fetchQueueData();
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);
    socket.io.on('reconnect', onReconnect);

    // Defer the initial connected-state sync so the effect does not trigger a
    // synchronous render before the live queue subscriptions are established.
    const connectionCheckTimer = setTimeout(() => {
      if (socket.connected) setConnectionStatus('LIVE');
    }, 0);

    const events = [
      'queue:updated', 'QUEUE_UPDATED',
      'queue:action', 'QUEUE_ACTION',
      'token:called', 'TOKEN_CALLED',
      'token:checked_in', 'TOKEN_CHECKED_IN',
      'token:serving', 'TOKEN_SERVICE_STARTED',
      'token:completed', 'TOKEN_SERVICE_COMPLETED',
      'token:cancelled', 'TOKEN_CANCELLED',
      'token:no_show', 'TOKEN_SKIPPED',
      'counter:updated', 'COUNTER_UPDATED'
    ];
    events.forEach(ev => socket.on(ev, fetchQueueData));

    // Fallback polling only when offline or disconnected
    const fallbackPoll = setInterval(() => { 
      if (!socket.connected) {
        fetchQueueData();
      }
    }, 10000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(connectionCheckTimer);
      socket.emit('leave-token', tokenId);
      clearInterval(fallbackPoll);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      socket.io.off('reconnect', onReconnect);
      events.forEach(ev => socket.off(ev, fetchQueueData));
    };
  }, [tokenId, fetchQueueData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (!data || !data.token) {
    return (
      <div className="p-6 text-center max-w-md mx-auto pt-16">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Token Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">This token does not exist or you do not have permission to view it.</p>
        <Button onClick={() => router.push('/citizen/home')} className="mt-6 bg-blue-600">Return Home</Button>
      </div>
    );
  }

  const { token, nowServing, peopleAhead, estimatedWaitMin, aiConfidence, nextTokens, predictionSource } = data;
  
  // Status-based queue progress calculation
  let progressPercent = 0;
  if (token.status === 'COMPLETED') {
    progressPercent = 100;
  } else if (token.status === 'SERVING') {
    progressPercent = 95;
  } else if (token.status === 'CALLED') {
    progressPercent = 90;
  } else if (token.status === 'CHECKED_IN') {
    progressPercent = Math.max(30, Math.min(85, 100 - (peopleAhead * 8)));
  } else if (token.status === 'WAITING') {
    progressPercent = Math.max(10, Math.min(80, 100 - (peopleAhead * 8)));
  } else {
    progressPercent = 0;
  }

  const isMlModel = predictionSource === 'ML_MODEL';

  return (
    <div className="space-y-6 pb-28 max-w-md mx-auto pt-4">
      {/* Top Bar with Live Connection Badge */}
      <div className="flex items-center justify-between mb-2 px-4">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="mr-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full" onClick={() => router.back()}>
            <ArrowLeft size={20} />
          </Button>
          <h2 className="text-xl font-bold text-slate-900">Live Queue Tracker</h2>
        </div>
        
        {/* Connection Status Indicator */}
        <div className="flex items-center">
          {connectionStatus === 'LIVE' && (
            <div className="flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
              Live Sync
            </div>
          )}
          {connectionStatus === 'RECONNECTING' && (
            <div className="flex items-center text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full shadow-2xs">
              <Loader2 className="animate-spin h-3 w-3 mr-1 text-amber-600" />
              Reconnecting
            </div>
          )}
          {connectionStatus === 'OFFLINE' && (
            <div className="flex items-center text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full shadow-2xs">
              <WifiOff size={12} className="mr-1 text-slate-500" />
              Offline
            </div>
          )}
          {connectionStatus === 'CONNECTING' && (
            <div className="flex items-center text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full shadow-2xs">
              <Loader2 className="animate-spin h-3 w-3 mr-1 text-blue-600" />
              Connecting
            </div>
          )}
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Urgent Action Callout Banners */}
        {token.status === 'CALLED' && (
          <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl shadow-sm text-amber-900 animate-bounce duration-1000">
            <div className="flex items-start gap-3">
              <Megaphone className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-black text-base">You are being called!</h4>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  Please proceed immediately to <strong>{token.counterName || (token.counterNumber ? `Counter ${token.counterNumber}` : 'the designated counter')}</strong> for your service.
                </p>
                <div className="mt-3">
                  <Link href={`/citizen/check-in?tokenId=${token._id}`}>
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9">
                      Confirm Arrival / Check In
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {token.status === 'SERVING' && (
          <div className="p-4 bg-blue-50 border border-blue-300 rounded-2xl shadow-sm text-blue-900">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-blue-600 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Service in Progress</h4>
                <p className="text-xs text-blue-700 mt-0.5">
                  Counter officer is currently serving your token at <strong>{token.counterName || (token.counterNumber ? `Counter ${token.counterNumber}` : 'Counter')}</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {token.status === 'COMPLETED' && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl shadow-sm text-emerald-900 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
            <h4 className="font-black text-base">Service Completed</h4>
            <p className="text-xs text-emerald-700 mt-1">
              Your appointment has ended. Thank you for using QueueLess Government Services!
            </p>
            <div className="mt-3">
              <Link href={`/citizen/feedback?tokenId=${token._id}`}>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                  <MessageSquare size={14} className="mr-1.5" /> Rate Your Experience
                </Button>
              </Link>
            </div>
          </div>
        )}

        {token.status === 'CANCELLED' && (
          <div className="p-4 bg-slate-100 border border-slate-300 rounded-2xl text-slate-700 text-center">
            <AlertCircle className="h-7 w-7 text-slate-500 mx-auto mb-1.5" />
            <h4 className="font-bold text-sm">Token Cancelled</h4>
            <p className="text-xs text-slate-500 mt-0.5">This queue ticket has been cancelled and is no longer active.</p>
          </div>
        )}

        {/* Token Primary Card */}
        <Card className="border-blue-200 shadow-sm overflow-hidden relative">
          <div className="bg-blue-600 h-2 absolute top-0 left-0 right-0" />
          <CardContent className="p-6 pt-7 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Official Queue Pass</p>
            <p className="text-5xl font-black text-slate-900 tracking-tighter mb-2">{token.tokenNumber}</p>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              {token.status}
            </div>

            <div className="text-xs text-slate-500 space-y-0.5 mt-2">
              <p className="font-semibold text-slate-700">{token.serviceName}</p>
              <p>{token.officeName}</p>
            </div>
          </CardContent>
        </Card>

        {/* Live Metrics Grid */}
        {token.status !== 'COMPLETED' && token.status !== 'CANCELLED' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-2xs relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-5"><Users size={48} /></div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">People Ahead</p>
                <p className="font-black text-3xl text-slate-900 relative z-10">
                  {token.status === 'CALLED' || token.status === 'SERVING' ? '0' : peopleAhead}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-2xs relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-5"><Clock size={48} /></div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Estimated Wait</p>
                <p className="font-black text-3xl text-slate-900 relative z-10">
                  {token.status === 'CALLED' || token.status === 'SERVING' ? '0' : estimatedWaitMin}
                  <span className="text-sm text-slate-400 font-semibold ml-1">min</span>
                </p>
              </div>
            </div>

            {/* Status-Based Progress Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold px-0.5">
                <span className="text-slate-500">Service Progress</span>
                <span className="text-blue-600">{progressPercent}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-700 ease-out" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            
            {/* Now Serving Status */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
              <div className="flex items-center">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl mr-3">
                  <Activity size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Now Serving at Counter</p>
                  <p className="font-bold text-slate-900 text-sm">
                    {typeof nowServing === 'object' && nowServing !== null 
                      ? `${nowServing.tokenNumber} (${nowServing.counterName})` 
                      : (nowServing || 'Waiting for call')}
                  </p>
                </div>
              </div>
            </div>

            {/* Next in Queue Tokens */}
            <Card className="shadow-2xs border-slate-200">
              <CardContent className="p-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center">
                  <Users size={14} className="mr-2 text-slate-400" />
                  Next in Queue
                </h3>
                <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
                  {nextTokens && nextTokens.length > 0 ? nextTokens.map((t, i: number) => {
                    const label = typeof t === 'object' && t !== null ? t.tokenNumber : t;
                    const isSelf = label === token.tokenNumber;
                    return (
                      <div 
                        key={i} 
                        className={`shrink-0 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                          isSelf 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
                            : i === 0 
                            ? 'bg-amber-50 border-amber-200 text-amber-800' 
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        {label} {isSelf && '(You)'}
                      </div>
                    );
                  }) : (
                    <p className="text-xs text-slate-400">Queue is currently clear</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Transparent Prediction Source Badge */}
            <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 border border-slate-200/80 rounded-xl p-3">
              <div className="flex items-center gap-2">
                {isMlModel ? (
                  <Sparkles size={15} className="text-blue-600 shrink-0" />
                ) : (
                  <Clock size={15} className="text-slate-500 shrink-0" />
                )}
                <div>
                  <p className="font-bold text-slate-800 text-[11px]">
                    {isMlModel ? 'AI Machine Learning Forecast' : 'Operational Queue Estimate'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {isMlModel ? 'Random Forest v2.1 (Calibrated)' : 'Statistical Baseline Heuristic'}
                  </p>
                </div>
              </div>
              
              {isMlModel && aiConfidence && Number(aiConfidence) > 0 && (
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-medium">Confidence</span>
                  <span className="font-black text-blue-700 text-xs">
                    {Math.round(Number(aiConfidence) <= 1 ? Number(aiConfidence) * 100 : Number(aiConfidence))}%
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 z-20 flex gap-2 max-w-md mx-auto">
        <Link href={`/citizen/queue/${tokenId}/prediction`} className="flex-1">
          <Button variant="outline" className="w-full text-blue-700 border-blue-200 hover:bg-blue-50 text-xs font-bold h-11">
            <Sparkles size={14} className="mr-1.5 text-blue-600" />
            AI Analytics Suite
          </Button>
        </Link>
        <Link href={`/citizen/queue/${tokenId}/leave-time`} className="flex-1">
          <Button variant="outline" className="w-full text-slate-700 border-slate-200 hover:bg-slate-50 text-xs font-bold h-11">
            <Clock size={14} className="mr-1.5 text-slate-500" />
            When Should I Leave
          </Button>
        </Link>
      </div>
    </div>
  );
}
