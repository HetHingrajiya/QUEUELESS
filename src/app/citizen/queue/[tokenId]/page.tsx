"use client";

import { useEffect, useState, use } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Users, Activity, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socketClient';

export default function CitizenLiveQueue({ params }: { params: Promise<{ tokenId: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const tokenId = unwrappedParams.tokenId;
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchQueueData = async () => {
    try {
      const res = await fetch(`/api/citizen/queue/${tokenId}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
    
    const socket = getSocket();
    socket.on('queue:updated', fetchQueueData);
    socket.on('token:called', fetchQueueData);
    socket.on('token:completed', fetchQueueData);
    
    return () => {
      socket.off('queue:updated');
      socket.off('token:called');
      socket.off('token:completed');
    };
  }, [params.tokenId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (!data || !data.token) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Token Not Found</h2>
        <Button onClick={() => router.push('/citizen/home')} className="mt-4">Return Home</Button>
      </div>
    );
  }

  const { token, nowServing, peopleAhead, estimatedWaitMin, aiConfidence, nextTokens } = data;
  
  // Progress bar logic
  let progressPercent = 0;
  if (token.status === 'WAITING' || token.status === 'CHECKED_IN') {
    // Arbitrary mapping just for visual feeling of progress
    // Assume original people ahead was some max value, but for now we just show it nearing 100% as peopleAhead approaches 0
    progressPercent = Math.max(10, 100 - (peopleAhead * 10));
  } else if (token.status === 'CALLED' || token.status === 'SERVING') {
    progressPercent = 100;
  }

  return (
    <div className="space-y-6 pb-24 max-w-md mx-auto pt-4">
      <div className="flex items-center mb-2 px-4">
        <Button variant="ghost" size="sm" className="mr-2 -ml-2 text-slate-500" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-xl font-bold text-slate-800">Live Queue</h2>
        <div className="ml-auto flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
          Live Sync
        </div>
      </div>

      <div className="px-4">
        <Card className="border-blue-200 shadow-blue-50 overflow-hidden relative mb-6">
          <div className="bg-blue-600 h-2 absolute top-0 left-0 right-0"></div>
          <CardContent className="p-6 pt-8 text-center">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Your Token</p>
            <p className="text-5xl font-black text-slate-900 tracking-tighter mb-2">{token.tokenNumber}</p>
            <p className="text-sm font-medium text-blue-600 bg-blue-50 py-1 px-3 rounded-full inline-block">
              {token.status}
            </p>
          </CardContent>
        </Card>

        {token.status !== 'COMPLETED' && token.status !== 'NO_SHOW' && token.status !== 'SKIPPED' && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10"><Users size={40} /></div>
                <p className="text-xs text-slate-500 mb-1">People Ahead</p>
                <p className="font-bold text-3xl text-slate-900 relative z-10">{token.status === 'CALLED' || token.status === 'SERVING' ? '0' : peopleAhead}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10"><Clock size={40} /></div>
                <p className="text-xs text-slate-500 mb-1">Est. Wait</p>
                <p className="font-bold text-3xl text-slate-900 relative z-10">{token.status === 'CALLED' || token.status === 'SERVING' ? '0' : estimatedWaitMin}<span className="text-sm text-slate-500 font-medium ml-1">m</span></p>
              </div>
            </div>

            <div className="mb-6 space-y-2">
              <div className="flex justify-between items-center text-xs font-medium px-1">
                <span className="text-slate-500">Queue Progress</span>
                <span className="text-blue-600">{progressPercent}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-in-out" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 flex items-center justify-between shadow-inner">
              <div className="flex items-center">
                <Activity className="text-amber-500 mr-3" size={20} />
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Now Serving</p>
                  <p className="font-bold text-slate-900">{nowServing || 'None'}</p>
                </div>
              </div>
            </div>

            <Card className="shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center">
                  <Users size={16} className="mr-2 text-slate-500" />
                  Next in Queue
                </h3>
                <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                  {nextTokens && nextTokens.length > 0 ? nextTokens.map((t: string, i: number) => (
                    <div key={i} className={`flex-shrink-0 px-3 py-1.5 rounded-lg border text-sm font-medium ${i === 0 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                      {t}
                    </div>
                  )) : (
                    <p className="text-sm text-slate-500">Queue is empty</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-6 flex justify-center items-center text-xs text-slate-500 bg-blue-50/50 rounded-lg p-3 border border-blue-100/50">
              <Sparkles size={14} className="mr-1.5 text-blue-500" />
              AI Confidence: <span className="font-bold text-slate-700 ml-1">{aiConfidence}%</span>
            </div>
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 z-10 flex space-x-3 max-w-md mx-auto">
        <Link href={`/citizen/queue/${params.tokenId}/prediction`} className="flex-1">
          <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50">
            View AI Insight
          </Button>
        </Link>
        <Link href={`/citizen/queue/${params.tokenId}/leave-time`} className="flex-1">
          <Button variant="outline" className="w-full text-slate-600">
            Leave Time
          </Button>
        </Link>
      </div>
    </div>
  );
}
