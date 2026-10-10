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
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!data || !data.token) {
    return (
      <div className="p-6 text-center max-w-md mx-auto pt-16">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold text-foreground">Token Not Found</h2>
        <p className="text-sm text-muted-foreground mt-1">This token does not exist or you do not have permission to view it.</p>
        <button onClick={() => router.push('/citizen/home')} className="mt-6 px-6 py-3 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset text-primary font-bold rounded-xl transition-all">
          Return Home
        </button>
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
    <div className="space-y-6 pb-32 max-w-6xl mx-auto pt-4 px-2 sm:px-6 cursor-default">
      {/* Top Bar with Live Connection Badge */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center">
          <button className="mr-4 w-12 h-12 flex items-center justify-center rounded-full bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset text-muted-foreground hover:text-foreground transition-all shrink-0" onClick={() => router.back()}>
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-widest">Live Tracker</h2>
        </div>
        
        {/* Connection Status Indicator - Neumorphic Pill */}
        <div className="flex items-center">
          {connectionStatus === 'LIVE' && (
            <div className="flex items-center text-[10px] sm:text-xs font-black uppercase tracking-widest text-emerald-500 bg-background shadow-neu-inset px-4 py-2 rounded-full">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
              Live Sync
            </div>
          )}
          {connectionStatus === 'RECONNECTING' && (
            <div className="flex items-center text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-500 bg-background shadow-neu-inset px-4 py-2 rounded-full">
              <Loader2 className="animate-spin h-3 w-3 mr-2 text-amber-500" />
              Reconnecting
            </div>
          )}
          {connectionStatus === 'OFFLINE' && (
            <div className="flex items-center text-[10px] sm:text-xs font-black uppercase tracking-widest text-muted-foreground bg-background shadow-neu-inset px-4 py-2 rounded-full">
              <WifiOff size={14} className="mr-2" />
              Offline
            </div>
          )}
          {connectionStatus === 'CONNECTING' && (
            <div className="flex items-center text-[10px] sm:text-xs font-black uppercase tracking-widest text-primary bg-background shadow-neu-inset px-4 py-2 rounded-full">
              <Loader2 className="animate-spin h-3 w-3 mr-2 text-primary" />
              Connecting
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Column: Official Pass & Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Urgent Action Callout Banners */}
          {token.status === 'CALLED' && (
            <div className="p-6 bg-background shadow-neu-inset border-2 border-amber-500/20 rounded-3xl animate-bounce duration-1000">
              <div className="flex items-start gap-5">
                <div className="p-4 bg-background shadow-neu rounded-2xl shrink-0">
                  <Megaphone className="h-8 w-8 text-amber-500" />
                </div>
                <div>
                  <h4 className="font-black text-xl text-foreground">You are being called!</h4>
                  <p className="text-sm font-semibold text-muted-foreground mt-2 leading-relaxed">
                    Please proceed immediately to <strong className="text-foreground">{token.counterName || (token.counterNumber ? `Counter ${token.counterNumber}` : 'the designated counter')}</strong> for your service.
                  </p>
                  <div className="mt-5">
                    <Link href={`/citizen/check-in?tokenId=${token._id}`}>
                      <button className="px-6 py-3 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset text-amber-500 font-bold text-sm rounded-xl transition-all">
                        Confirm Arrival / Check In
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {token.status === 'SERVING' && (
            <div className="p-6 bg-background shadow-neu-inset rounded-3xl">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-background shadow-neu rounded-2xl shrink-0">
                  <Activity className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h4 className="font-black text-lg text-foreground">Service in Progress</h4>
                  <p className="text-sm font-semibold text-muted-foreground mt-2">
                    Counter officer is currently serving your token at <strong className="text-foreground">{token.counterName || (token.counterNumber ? `Counter ${token.counterNumber}` : 'Counter')}</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {token.status === 'COMPLETED' && (
            <div className="p-8 bg-background shadow-neu-inset rounded-3xl text-center">
              <div className="mx-auto w-20 h-20 bg-background shadow-neu rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <h4 className="font-black text-2xl text-foreground">Service Completed</h4>
              <p className="text-sm font-semibold text-muted-foreground mt-3">
                Your appointment has ended. Thank you for using SamaySetu!
              </p>
              <div className="mt-8">
                <Link href={`/citizen/feedback?tokenId=${token._id}`}>
                  <button className="px-6 py-4 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset text-emerald-500 font-bold text-sm rounded-xl transition-all flex items-center justify-center mx-auto gap-3">
                    <MessageSquare size={18} /> Rate Your Experience
                  </button>
                </Link>
              </div>
            </div>
          )}

          {token.status === 'CANCELLED' && (
            <div className="p-6 bg-background shadow-neu-inset rounded-3xl text-center">
              <div className="mx-auto w-16 h-16 bg-background shadow-neu rounded-2xl flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h4 className="font-black text-xl text-foreground">Token Cancelled</h4>
              <p className="text-sm font-semibold text-muted-foreground mt-2">This queue ticket has been cancelled and is no longer active.</p>
            </div>
          )}

          {/* Token Primary Card */}
          <div className="bg-background shadow-neu rounded-[2.5rem] p-10 text-center border-0 relative overflow-hidden transition-all hover:shadow-neu-hover">
            <p className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Official Queue Pass</p>
            <div className="w-full max-w-[240px] mx-auto bg-background shadow-neu-inset rounded-[2rem] py-6 my-8">
               <p className="text-7xl font-black text-primary tracking-tighter">{token.tokenNumber}</p>
            </div>
            
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest bg-background shadow-neu-inset text-foreground mb-6">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              {token.status}
            </div>

            <div className="text-sm font-semibold text-muted-foreground space-y-2 mt-2">
              <p className="text-base font-black text-foreground">{token.serviceName}</p>
              <p>{token.officeName}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Live Metrics */}
        <div className="lg:col-span-7 space-y-6">
          {token.status !== 'COMPLETED' && token.status !== 'CANCELLED' && (
            <>
              {/* Live Metrics Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-background shadow-neu rounded-[2rem] p-8 text-center border-0 relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-neu-hover">
                  <div className="absolute top-0 right-0 p-4 opacity-5"><Users size={72} className="text-foreground" /></div>
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">People Ahead</p>
                  <p className="font-black text-6xl text-foreground relative z-10 drop-shadow-sm">
                    {token.status === 'CALLED' || token.status === 'SERVING' ? '0' : peopleAhead}
                  </p>
                </div>

                <div className="bg-background shadow-neu rounded-[2rem] p-8 text-center border-0 relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-neu-hover">
                  <div className="absolute top-0 right-0 p-4 opacity-5"><Clock size={72} className="text-foreground" /></div>
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Estimated Wait</p>
                  <div className="font-black text-6xl text-foreground relative z-10 drop-shadow-sm flex items-baseline justify-center gap-2">
                    {token.status === 'CALLED' || token.status === 'SERVING' ? '0' : estimatedWaitMin}
                    <span className="text-lg text-muted-foreground font-black tracking-widest">MIN</span>
                  </div>
                </div>
              </div>

              {/* Status-Based Progress Bar */}
              <div className="bg-background shadow-neu rounded-3xl p-6 border-0 space-y-5">
                <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest px-2">
                  <span className="text-muted-foreground">Service Progress</span>
                  <span className="text-primary">{progressPercent}%</span>
                </div>
                <div className="h-5 w-full bg-background shadow-neu-inset rounded-full p-1.5 overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full shadow-neu transition-all duration-700 ease-out" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              
              {/* Now Serving Status */}
              <div className="bg-background shadow-neu-inset rounded-3xl p-6 flex items-center justify-between border-0">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-background shadow-neu rounded-2xl text-primary">
                    <Activity size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mb-1">Now Serving</p>
                    <p className="font-black text-foreground text-base">
                      {typeof nowServing === 'object' && nowServing !== null 
                        ? `${nowServing.tokenNumber} (${nowServing.counterName})` 
                        : (nowServing || 'Waiting for call')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Next in Queue Tokens */}
              <div className="bg-background shadow-neu rounded-3xl border-0">
                <div className="p-6 pb-2">
                  <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Users size={16} className="text-primary" />
                    Next in Queue
                  </h3>
                  <div className="flex space-x-5 overflow-x-auto p-4 -mx-4 scrollbar-hide">
                    {nextTokens && nextTokens.length > 0 ? nextTokens.map((t, i: number) => {
                      const label = typeof t === 'object' && t !== null ? t.tokenNumber : t;
                      const isSelf = label === token.tokenNumber;
                      return (
                        <div 
                          key={i} 
                          className={`shrink-0 px-6 py-3 rounded-2xl text-sm font-black tracking-wide ${
                            isSelf 
                              ? 'bg-background shadow-neu-inset text-primary border-2 border-primary/20' 
                              : i === 0 
                              ? 'bg-background shadow-neu text-foreground' 
                              : 'bg-background shadow-neu-inset text-muted-foreground'
                          }`}
                        >
                          {label} {isSelf && '(You)'}
                        </div>
                      );
                    }) : (
                      <p className="text-sm font-semibold text-muted-foreground px-4">Queue is currently clear</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Prediction Source Badge */}
              <div className="flex items-center justify-between text-sm bg-background shadow-neu-inset rounded-[2rem] p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-background shadow-neu rounded-xl shrink-0">
                    {isMlModel ? (
                      <Sparkles size={20} className="text-primary" />
                    ) : (
                      <Clock size={20} className="text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-black text-foreground text-xs uppercase tracking-wider mb-1">
                      {isMlModel ? 'AI Forecast' : 'Operational Estimate'}
                    </p>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {isMlModel ? 'Random Forest v2.1' : 'Statistical Baseline'}
                    </p>
                  </div>
                </div>
                
                {isMlModel && aiConfidence && Number(aiConfidence) > 0 && (
                  <div className="text-right px-3">
                    <span className="text-[10px] text-muted-foreground block font-black uppercase tracking-widest mb-1">Confidence</span>
                    <span className="font-black text-primary text-base">
                      {Math.round(Number(aiConfidence) <= 1 ? Number(aiConfidence) * 100 : Number(aiConfidence))}%
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Sticky Action Bar - Centered without sidebar */}
      <div className="fixed bottom-0 left-0 lg:left-64 right-0 p-4 sm:p-6 bg-background shadow-neu-inset z-20 border-0 flex justify-center">
        <div className="flex gap-4 sm:gap-6 w-full max-w-lg">
          <Link href={`/citizen/queue/${tokenId}/prediction`} className="flex-1">
            <button className="w-full text-primary bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl text-[10px] sm:text-xs uppercase tracking-widest font-black h-14 flex items-center justify-center gap-3 transition-all">
              <Sparkles size={18} />
              Analytics
            </button>
          </Link>
          <Link href={`/citizen/queue/${tokenId}/leave-time`} className="flex-1">
            <button className="w-full text-foreground bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl text-[10px] sm:text-xs uppercase tracking-widest font-black h-14 flex items-center justify-center gap-3 transition-all">
              <Clock size={18} className="text-muted-foreground" />
              Leave Time
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
