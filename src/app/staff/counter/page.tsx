"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Monitor, PauseCircle, PlayCircle, PowerOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getSocket } from '@/lib/socketClient';

export default function StaffCounterPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);

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

  const updateCounterStatus = async (status: string) => {
    try {
      setStatusLoading(status);
      const res = await fetch('/api/staff/counter/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const resData = await res.json();
      
      if (resData.success) {
        await fetchDashboardData();
      } else {
        alert(resData.message || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while updating status');
    } finally {
      setStatusLoading(null);
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

  const { counter, currentToken, stats } = data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-800';
      case 'PAUSED': return 'bg-amber-100 text-amber-800';
      case 'OFFLINE': return 'bg-slate-200 text-slate-800';
      case 'SERVING': return 'bg-blue-100 text-blue-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">My Counter</h2>
        <Badge className={getStatusColor(counter.status)} variant="outline">
          {counter.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="w-5 h-5 mr-2 text-blue-600" />
              Counter Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 text-sm">
              <div>
                <dt className="text-slate-500 font-medium">Counter Name</dt>
                <dd className="mt-1 font-semibold text-slate-900">{counter.name}</dd>
              </div>
              <div>
                <dt className="text-slate-500 font-medium">Counter Number</dt>
                <dd className="mt-1 font-semibold text-slate-900">{counter.number}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-slate-500 font-medium">Assigned Services</dt>
                <dd className="mt-1 font-semibold text-slate-900 leading-relaxed">{counter.serviceNames}</dd>
              </div>
              <div>
                <dt className="text-slate-500 font-medium">Currently Serving</dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {currentToken ? currentToken.tokenNumber : 'None'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 font-medium">Tokens Waiting</dt>
                <dd className="mt-1 font-semibold text-slate-900">{stats.waitingCount}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Counter Status</CardTitle>
            <CardDescription>Manage the operational status of your counter</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full justify-start bg-emerald-600 hover:bg-emerald-700 h-12"
              disabled={counter.status === 'ACTIVE' || statusLoading !== null}
              onClick={() => updateCounterStatus('ACTIVE')}
            >
              {statusLoading === 'ACTIVE' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlayCircle className="mr-2 h-5 w-5" />}
              Set Active
            </Button>
            
            <Button 
              className="w-full justify-start bg-amber-600 hover:bg-amber-700 h-12"
              disabled={counter.status === 'PAUSED' || statusLoading !== null}
              onClick={() => updateCounterStatus('PAUSED')}
            >
              {statusLoading === 'PAUSED' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PauseCircle className="mr-2 h-5 w-5" />}
              Pause Counter
            </Button>

            <Button 
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 h-12 border-red-200"
              disabled={counter.status === 'OFFLINE' || statusLoading !== null}
              onClick={() => updateCounterStatus('OFFLINE')}
            >
              {statusLoading === 'OFFLINE' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PowerOff className="mr-2 h-5 w-5" />}
              Take Offline
            </Button>
            
            {counter.status === 'PAUSED' && (
              <p className="text-sm text-amber-600 text-center mt-4 bg-amber-50 p-3 rounded-md">
                Your counter is paused. You will not receive new walk-in citizens or auto-assignments until you resume.
              </p>
            )}
            
            {counter.status === 'OFFLINE' && (
              <p className="text-sm text-red-600 text-center mt-4 bg-red-50 p-3 rounded-md">
                Your counter is completely offline. This counter is invisible to citizens in the live queue displays.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
