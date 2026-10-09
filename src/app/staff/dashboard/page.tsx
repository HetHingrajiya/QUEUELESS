"use client";
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ticket, Users, CheckCircle2, PlayCircle, Loader2 } from 'lucide-react';
import { getSocket } from '@/lib/socketClient';

export default function StaffDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [serviceTimer, setServiceTimer] = useState<string>("00:00");

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
        
        if (userData.success) {
          setUser(userData.data);
          
          if (userData.data.officeId) {
            const socket = getSocket();
            socket.emit('join-office', userData.data.officeId);
            
            socket.on('queue:updated', () => {
              fetchDashboardData();
            });
            
            socket.on('token:called', () => {
              fetchDashboardData();
            });
          }

          await fetchDashboardData();
        }
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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (data?.currentToken?.startTime && data.currentToken.status === 'SERVING') {
      interval = setInterval(() => {
        const diff = Math.floor((Date.now() - new Date(data.currentToken.startTime).getTime()) / 1000);
        const mins = Math.floor(diff / 60).toString().padStart(2, '0');
        const secs = (diff % 60).toString().padStart(2, '0');
        setServiceTimer(`${mins}:${secs}`);
      }, 1000);
    } else {
      setServiceTimer("00:00");
    }
    return () => clearInterval(interval);
  }, [data?.currentToken]);

  const handleAction = async (action: string, tokenId?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/staff/token/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, tokenId })
      });
      const json = await res.json();
      if (json.success) {
        const socket = getSocket();
        socket.emit('queue:action', { action, officeId: user?.officeId });
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCounterStatus = async (status: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/staff/counter/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (json.success) {
        const socket = getSocket();
        socket.emit('queue:action', { action: `COUNTER_${status}`, officeId: user?.officeId });
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
        <h3 className="text-xl font-bold text-slate-800">Unable to load staff dashboard</h3>
        <p className="text-slate-500 max-w-sm">No dashboard data available for this staff account. Please verify your counter assignment or contact an administrator.</p>
        <Button onClick={() => fetchDashboardData()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {data?.counter ? (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{data.counter.name}</h2>
            <p className="text-slate-500">{data.counter.serviceNames || 'All Services'}</p>
          </div>
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex flex-col items-end mr-2 pr-2 border-r border-slate-100">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Status</span>
              <span className={`flex items-center text-sm font-bold ${data.counter.status === 'ACTIVE' ? 'text-emerald-600' : data.counter.status === 'PAUSED' ? 'text-amber-600' : 'text-slate-500'}`}>
                <span className={`flex h-2 w-2 rounded-full mr-2 ${data.counter.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : data.counter.status === 'PAUSED' ? 'bg-amber-500' : 'bg-slate-400'}`}></span>
                {data.counter.status}
              </span>
            </div>
            <div className="flex space-x-1">
              {data.counter.status !== 'ACTIVE' && (
                <Button size="sm" variant="outline" className="h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleCounterStatus('ACTIVE')} disabled={actionLoading}>
                  Go Active
                </Button>
              )}
              {data.counter.status === 'ACTIVE' && (
                <Button size="sm" variant="outline" className="h-8 text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => handleCounterStatus('PAUSED')} disabled={actionLoading}>
                  Pause
                </Button>
              )}
              {data.counter.status !== 'OFFLINE' && (
                <Button size="sm" variant="outline" className="h-8 text-slate-600 hover:bg-slate-50" onClick={() => handleCounterStatus('OFFLINE')} disabled={actionLoading}>
                  Offline
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Office Dashboard</h2>
            <p className="text-slate-500">Viewing all office tokens</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.counter ? (
        <Card className="md:col-span-2 border-blue-200 shadow-blue-50">
          <CardHeader className="bg-blue-50 border-b border-blue-100 pb-4">
            <CardTitle className="text-blue-800 flex items-center justify-between">
              <span>Current Token</span>
              <span className="text-sm font-normal bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                {data.currentToken ? data.currentToken.status : 'Idle'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between">
              {data.currentToken ? (
                <div className="mb-6 sm:mb-0 text-center sm:text-left">
                  <p className="text-5xl font-black text-slate-900 tracking-tight">{data.currentToken.tokenNumber}</p>
                  <p className="text-lg text-slate-600 mt-2">Citizen: {data.currentToken.citizenName}</p>
                  {data.currentToken.status === 'SERVING' && (
                    <div className="flex items-center mt-4 text-sm text-slate-500 justify-center sm:justify-start">
                      <PlayCircle size={16} className="mr-2" />
                      Service time: {serviceTimer}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-6 sm:mb-0 text-center sm:text-left text-slate-500 py-8">
                  <p className="text-lg">No active token</p>
                  <p className="text-sm mt-2">Call the next person from the queue.</p>
                </div>
              )}
              
              <div className="flex flex-col space-y-3 w-full sm:w-auto">
                {data.currentToken ? (
                  <>
                    {data.currentToken.status === 'CALLED' ? (
                      <Button onClick={() => handleAction('START_SERVICE', data.currentToken._id)} disabled={actionLoading} className="w-full sm:w-48 bg-blue-600 hover:bg-blue-700" size="lg">
                        {actionLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null} Start Service
                      </Button>
                    ) : (
                      <Button onClick={() => handleAction('COMPLETE', data.currentToken._id)} disabled={actionLoading} className="w-full sm:w-48 bg-emerald-600 hover:bg-emerald-700" size="lg">
                        {actionLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null} Complete Service
                      </Button>
                    )}
                    
                    <Button onClick={() => handleAction('NO_SHOW', data.currentToken._id)} disabled={actionLoading} variant="outline" className="w-full sm:w-48 text-amber-600 border-amber-200 hover:bg-amber-50">
                      No Show
                    </Button>
                    <Button onClick={() => handleAction('SKIP', data.currentToken._id)} disabled={actionLoading} variant="ghost" className="w-full sm:w-48 text-red-600 hover:bg-red-50 hover:text-red-700">
                      Skip Token
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => handleAction('CALL_NEXT')} disabled={actionLoading || (data?.nextTokens || []).length === 0} className="w-full sm:w-48 bg-blue-600 hover:bg-blue-700" size="lg">
                    {actionLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null} Call Next
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="md:col-span-2 border-slate-200 shadow-sm flex items-center justify-center py-12">
           <div className="text-center text-slate-500">
             <h3 className="text-xl font-bold text-slate-700 mb-2">No Counter Assigned</h3>
             <p className="max-w-xs mx-auto">You can monitor the office queue, but you cannot serve tokens.</p>
           </div>
        </Card>
      )}

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Waiting in Queue</p>
                  <p className="text-3xl font-bold text-slate-900">{data?.stats?.waitingCount || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <Users size={24} />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-600">Next: <span className="font-bold text-slate-900">{data?.nextTokens?.[0]?.tokenNumber || 'None'}</span></p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Completed Today</p>
                  <p className="text-3xl font-bold text-slate-900">{data?.stats?.completedToday || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 size={24} />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-600">Avg Time: <span className="font-bold text-slate-900">{data?.stats?.avgServiceTime || '0.0'}m</span></p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Next in Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 rounded-l-lg">Token</th>
                  <th scope="col" className="px-6 py-3">Service</th>
                  <th scope="col" className="px-6 py-3">Wait Time</th>
                  <th scope="col" className="px-6 py-3 rounded-r-lg">Action</th>
                </tr>
              </thead>
              <tbody>
                {data?.nextTokens && data.nextTokens.length > 0 ? (
                  data.nextTokens.map((item: any, i: number) => (
                    <tr key={item._id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                      <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                        {item.tokenNumber}
                      </th>
                      <td className="px-6 py-4">{item.serviceName}</td>
                      <td className="px-6 py-4">{item.waitTime} mins</td>
                      <td className="px-6 py-4">
                        <Button 
                          onClick={() => {
                            if (!data?.currentToken) handleAction('CALL_NEXT', item._id);
                          }}
                          variant="outline" size="sm" disabled={i !== 0 || actionLoading || !!data?.currentToken} className={i === 0 && !data?.currentToken ? 'text-blue-600 border-blue-200 bg-blue-50' : ''}>
                          Call Next
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No citizens waiting in the queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
