"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Clock, CheckCircle2, UserX, SkipForward, PlayCircle } from 'lucide-react';
import { getSocket } from '@/lib/socketClient';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function StaffCurrentTokenPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/staff/dashboard');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        
        if (userData.success && userData.data.officeId) {
          const socket = getSocket();
          socket.emit('join-office', userData.data.officeId);
          socket.on('queue:updated', () => fetchDashboardData());
          socket.on('token:called', () => fetchDashboardData());
        }
        await fetchDashboardData();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();

    return () => {
      const socket = getSocket();
      socket.off('queue:updated');
      socket.off('token:called');
    };
  }, []);

  const handleAction = async (action: string, tokenId: string) => {
    try {
      setActionLoading(action);
      const res = await fetch('/api/staff/token/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, tokenId })
      });
      const resData = await res.json();
      if (resData.success) {
        await fetchDashboardData();
      } else {
        alert(resData.message || 'Action failed');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (!data || !data.counter) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">No Counter Assigned</h2>
        <p className="text-slate-500">You have not been assigned to a counter yet. Please contact your administrator.</p>
      </div>
    );
  }

  const currentToken = data.currentToken;
  const nextToken = data.nextTokens?.[0];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Current Token</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-blue-200 shadow-md">
          <CardHeader className="bg-blue-50 border-b border-blue-100 rounded-t-lg">
            <div className="flex justify-between items-center">
              <CardTitle className="text-blue-800">Currently Serving</CardTitle>
              {currentToken && (
                <Badge className={currentToken.status === 'SERVING' ? 'bg-emerald-500' : 'bg-amber-500'}>
                  {currentToken.status}
                </Badge>
              )}
            </div>
            <CardDescription className="text-blue-600">The token currently at your counter</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {currentToken ? (
              <div className="text-center py-6">
                <div className="text-5xl font-black text-slate-900 mb-4 tracking-tight">
                  {currentToken.tokenNumber}
                </div>
                <div className="text-lg font-medium text-slate-700 mb-1">{currentToken.citizenName}</div>
                <div className="text-slate-500 mb-8">{currentToken.serviceName}</div>
                
                <div className="grid grid-cols-2 gap-3 mt-6">
                  {currentToken.status === 'CALLED' ? (
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-base" 
                      disabled={actionLoading !== null}
                      onClick={() => handleAction('START', currentToken._id)}
                    >
                      {actionLoading === 'START' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Clock className="mr-2 h-5 w-5" />}
                      Start Service
                    </Button>
                  ) : (
                    <Button 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base" 
                      disabled={actionLoading !== null}
                      onClick={() => handleAction('COMPLETE', currentToken._id)}
                    >
                      {actionLoading === 'COMPLETE' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                      Complete
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-12 text-base"
                    disabled={actionLoading !== null}
                    onClick={() => handleAction('NO_SHOW', currentToken._id)}
                  >
                    {actionLoading === 'NO_SHOW' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserX className="mr-2 h-5 w-5" />}
                    No Show
                  </Button>
                </div>
                <div className="mt-4">
                  <Link href={`/staff/queue/${currentToken._id}`} className="text-blue-600 hover:underline text-sm font-medium">
                    View Full Token Details &rarr;
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                  <Loader2 className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">No Active Token</h3>
                <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                  You are not currently serving anyone. Check the queue to call the next citizen.
                </p>
                {nextToken ? (
                  <Button 
                    size="lg" 
                    className="bg-indigo-600 hover:bg-indigo-700 px-8"
                    disabled={actionLoading !== null}
                    onClick={() => handleAction('CALL_NEXT', nextToken._id)}
                  >
                    {actionLoading === 'CALL_NEXT' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlayCircle className="mr-2 h-5 w-5" />}
                    Call Next: {nextToken.tokenNumber}
                  </Button>
                ) : (
                  <Button variant="outline" disabled>
                    Queue is Empty
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
