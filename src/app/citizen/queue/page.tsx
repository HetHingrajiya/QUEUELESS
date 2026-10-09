"use client";
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Car, Clock, Navigation, Ticket, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getSocket } from '@/lib/socketClient';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { EmptyState } from '@/components/common/EmptyState';
import { CitizenQueueSummary, ApiResponse } from '@/types/citizen';

export default function LiveQueue() {
  const router = useRouter();
  const [data, setData] = useState<CitizenQueueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchQueueData = useCallback(async () => {
    try {
      const res = await fetch('/api/citizen/queue');
      const json: ApiResponse<CitizenQueueSummary> = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (e: unknown) {
      console.error('Failed to fetch live queue data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQueueData();
    }, 0);

    const socket = getSocket();

    const handleUpdate = () => {
      fetchQueueData();
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


    // Polling fallback if socket disconnected
    const fallbackPoll = setInterval(() => {
      if (!socket.connected) {
        fetchQueueData();
      }
    }, 10000);

    return () => {
      clearTimeout(timer);
      events.forEach(ev => socket.off(ev, handleUpdate));
      clearInterval(fallbackPoll);
    };
  }, [fetchQueueData]);

  // Join token-specific room whenever token data is active
  useEffect(() => {
    if (data?.token?._id) {
      const socket = getSocket();
      socket.emit('join-token', data.token._id);
      return () => {
        socket.emit('leave-token', data.token._id);
      };
    }
  }, [data?.token?._id]);

  const handleCancelToken = async () => {
    if (!data?.token?._id || cancelling) return;
    if (!confirm('Are you sure you want to cancel your queue token?')) return;

    try {
      setCancelling(true);
      const res = await fetch('/api/citizen/token/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: data.token._id, reason: 'Cancelled by citizen' })
      });
      const json = await res.json();
      if (json.success) {
        fetchQueueData();
        router.push('/citizen/token-lifecycle/cancelled');
      } else {
        alert(json.message || 'Failed to cancel token');
      }
    } catch (e) {
      console.error(e);
      alert('Error cancelling token');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-24 max-w-md mx-auto pt-4">
        <SkeletonLoader type="queue" />
      </div>
    );
  }

  if (!data || !data.token) {
    return (
      <div className="space-y-6 pb-24 max-w-md mx-auto pt-4">
        <div className="flex items-center mb-2 px-4">
          <Link href="/citizen/home" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Live Queue</h1>
        </div>
        <div className="p-4">
          <EmptyState
            icon={<Users size={32} />}
            title="No Active Queue Token"
            description="You do not currently have a waiting token in any active line."
            actionText="Join a Queue"
            actionHref="/citizen/offices"
          />
        </div>
      </div>
    );
  }

  const { token, nowServing, peopleAhead = 0, estimatedWaitMin = 0 } = data;

  // Real progress calculation
  let progress = 10;
  if (token.status === 'CALLED' || token.status === 'SERVING') {
    progress = 100;
  } else if (token.status === 'COMPLETED') {
    progress = 100;
  } else {
    progress = Math.max(10, Math.min(95, 100 - (peopleAhead * 10)));
  }

  const leaveInMins = Math.max(1, estimatedWaitMin - 15);
  const recDeparture = new Date();
  recDeparture.setMinutes(recDeparture.getMinutes() + leaveInMins);
  const recDepartureStr = recDeparture.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6 pb-24 max-w-md mx-auto pt-4">
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex items-center">
          <Link href="/citizen/home" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Live Queue</h1>
        </div>
        <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-semibold flex items-center border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
          Live
        </div>
      </div>

      {/* When should I leave? Feature */}
      <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Car size={100} />
        </div>
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center space-x-2 text-blue-100 mb-4">
            <Navigation size={18} />
            <h2 className="font-medium text-sm tracking-wide uppercase">Smart Prediction</h2>
          </div>
          
          <p className="text-4xl font-bold mb-1">
            {estimatedWaitMin > 15 ? `Leave in ${leaveInMins} min` : 'Proceed to Office'}
          </p>
          <p className="text-blue-100 text-sm mb-6">
            {estimatedWaitMin > 15 ? 'to arrive on time for your turn.' : 'Your turn is approaching shortly.'}
          </p>

          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
            <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3 mb-3">
              <span className="text-blue-100">Queue Wait</span>
              <span className="font-semibold">{estimatedWaitMin} min</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3 mb-3">
              <span className="text-blue-100">Travel Time</span>
              <span className="font-semibold">10 min</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-blue-100">Check-in Buffer</span>
              <span className="font-semibold">5 min</span>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-blue-200 uppercase tracking-wider mb-1">Recommended Departure</p>
            <p className="text-xl font-bold">{recDepartureStr}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-blue-200 shadow-blue-50 bg-blue-50/30">
          <CardContent className="p-5 text-center">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Your Token</p>
            <p className="text-4xl font-black text-slate-900">{token.tokenNumber}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-5 text-center flex flex-col justify-center h-full">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Current Token</p>
            <p className="text-3xl font-bold text-slate-700">
              {typeof nowServing === 'object' && nowServing !== null 
                ? nowServing.tokenNumber 
                : (nowServing || 'None')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-sm font-medium text-slate-500">Queue Progress</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{progress}%</p>
          </div>
          <Progress value={progress} className="h-3 mb-6" />
          
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mr-3">
                <Ticket size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500">People Ahead</p>
                <p className="font-bold text-slate-900">{peopleAhead}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mr-3">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500">AI Est. Wait</p>
                <p className="font-bold text-slate-900">{estimatedWaitMin} min</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Button 
        variant="outline" 
        onClick={handleCancelToken}
        disabled={cancelling}
        className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-12"
      >
        {cancelling ? 'Cancelling...' : 'Cancel Token'}
      </Button>
    </div>
  );
}
