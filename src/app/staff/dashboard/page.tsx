"use client";
import { useEffect, useState } from 'react';
import { Loader2, Users, CheckCircle2, PlayCircle, Hash, MonitorDot, AlertCircle, ArrowRight } from 'lucide-react';
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
      <div className="flex justify-center items-center h-[50vh] cursor-default">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center items-center h-[50vh] cursor-default max-w-xl mx-auto">
        <div className="bg-background shadow-neu rounded-[2.5rem] p-12 text-center border-0">
          <div className="w-20 h-20 bg-background shadow-neu-inset rounded-[2rem] flex items-center justify-center mb-6 text-red-500 mx-auto">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-xl font-black text-foreground mb-2">Unable to load dashboard</h3>
          <p className="text-sm font-bold text-muted-foreground">
            No dashboard data available for this staff account. Please verify your counter assignment or contact an administrator.
          </p>
          <button 
            onClick={() => fetchDashboardData()} 
            className="mt-8 h-12 px-8 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl text-xs font-black tracking-widest text-primary transition-all border-0"
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-4 lg:mb-8 px-4 sm:px-6 lg:px-8">
        <div>
          {data?.counter ? (
            <>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{data.counter.name}</h1>
              <p className="text-muted-foreground text-xs sm:text-sm font-semibold mt-1">{data.counter.serviceNames || 'All Services'}</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Office Dashboard</h1>
              <p className="text-muted-foreground text-xs sm:text-sm font-semibold mt-1">Viewing all office tokens</p>
            </>
          )}
        </div>
        
        {data?.counter && (
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-background shadow-neu-inset px-6 py-4 rounded-[2rem]">
            <div className="flex flex-col items-center sm:items-end pr-0 sm:pr-4 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800 pb-3 sm:pb-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Status</span>
              <span className={`flex items-center text-sm font-black uppercase tracking-widest ${data.counter.status === 'ACTIVE' ? 'text-emerald-500' : data.counter.status === 'PAUSED' ? 'text-amber-500' : 'text-slate-500'}`}>
                <span className={`flex h-2 w-2 rounded-full mr-2 ${data.counter.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : data.counter.status === 'PAUSED' ? 'bg-amber-500' : 'bg-slate-400'}`}></span>
                {data.counter.status}
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {data.counter.status !== 'ACTIVE' && (
                <button onClick={() => handleCounterStatus('ACTIVE')} disabled={actionLoading} className="h-10 px-4 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl text-[10px] font-black tracking-widest text-emerald-500 transition-all border-0 disabled:opacity-50">
                  GO ACTIVE
                </button>
              )}
              {data.counter.status === 'ACTIVE' && (
                <button onClick={() => handleCounterStatus('PAUSED')} disabled={actionLoading} className="h-10 px-4 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl text-[10px] font-black tracking-widest text-amber-500 transition-all border-0 disabled:opacity-50">
                  PAUSE
                </button>
              )}
              {data.counter.status !== 'OFFLINE' && (
                <button onClick={() => handleCounterStatus('OFFLINE')} disabled={actionLoading} className="h-10 px-4 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl text-[10px] font-black tracking-widest text-slate-500 transition-all border-0 disabled:opacity-50">
                  OFFLINE
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 sm:px-6 lg:px-8 space-y-6 lg:space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Main Action Area (Left) */}
          <div className="lg:col-span-8">
            {data?.counter ? (
              <div className="bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0 h-full flex flex-col justify-center">
                
                <div className="flex items-center justify-between mb-8">
                   <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current Token</h2>
                   <div className="px-3 py-1 bg-background shadow-neu-inset rounded-xl">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                        {data.currentToken ? data.currentToken.status : 'Idle'}
                      </span>
                   </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  {/* Token Info */}
                  <div className="text-center md:text-left">
                    {data.currentToken ? (
                      <>
                        <p className="text-6xl sm:text-7xl font-black text-foreground tracking-tight leading-none mb-4">{data.currentToken.tokenNumber}</p>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{data.currentToken.citizenName}</p>
                        {data.currentToken.status === 'SERVING' && (
                          <div className="flex items-center mt-6 text-sm font-black text-primary justify-center md:justify-start bg-background shadow-neu-inset px-4 py-2 rounded-xl inline-flex">
                            <PlayCircle size={16} className="mr-2 animate-pulse" />
                            {serviceTimer}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="py-8">
                        <div className="w-20 h-20 bg-background shadow-neu-inset rounded-[2rem] flex items-center justify-center text-muted-foreground/30 mx-auto md:mx-0 mb-6">
                           <Hash size={32} />
                        </div>
                        <p className="text-2xl font-black text-foreground mb-2">No Active Token</p>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Ready to serve next citizen</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-4 w-full md:w-auto">
                    {data.currentToken ? (
                      <>
                        {data.currentToken.status === 'CALLED' ? (
                          <button onClick={() => handleAction('START_SERVICE', data.currentToken._id)} disabled={actionLoading} className="h-16 px-10 bg-primary shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 rounded-[1.5rem] text-xs font-black tracking-widest text-primary-foreground flex items-center justify-center transition-all border-0 disabled:opacity-50">
                            {actionLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <PlayCircle className="mr-2" size={18} />} START SERVICE
                          </button>
                        ) : (
                          <button onClick={() => handleAction('COMPLETE', data.currentToken._id)} disabled={actionLoading} className="h-16 px-10 bg-emerald-500 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1 rounded-[1.5rem] text-xs font-black tracking-widest text-white flex items-center justify-center transition-all border-0 disabled:opacity-50">
                            {actionLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <CheckCircle2 className="mr-2" size={18} />} COMPLETE SERVICE
                          </button>
                        )}
                        <div className="flex gap-4">
                          <button onClick={() => handleAction('NO_SHOW', data.currentToken._id)} disabled={actionLoading} className="flex-1 h-12 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl text-[10px] font-black tracking-widest text-amber-500 transition-all border-0">
                            NO SHOW
                          </button>
                          <button onClick={() => handleAction('SKIP', data.currentToken._id)} disabled={actionLoading} className="flex-1 h-12 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl text-[10px] font-black tracking-widest text-red-500 transition-all border-0">
                            SKIP
                          </button>
                        </div>
                      </>
                    ) : (
                      <button 
                        onClick={() => handleAction('CALL_NEXT')} 
                        disabled={actionLoading || (data?.nextTokens || []).length === 0} 
                        className="h-16 px-12 bg-primary shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 rounded-[1.5rem] text-xs font-black tracking-widest text-primary-foreground flex items-center justify-center transition-all border-0 disabled:opacity-50 disabled:hover:translate-y-0"
                      >
                        {actionLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null} CALL NEXT
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-background shadow-neu rounded-[2.5rem] p-12 border-0 h-full flex flex-col items-center justify-center text-center">
                 <div className="w-20 h-20 bg-background shadow-neu-inset rounded-[2rem] flex items-center justify-center text-muted-foreground/50 mb-6">
                    <MonitorDot size={32} />
                 </div>
                 <h3 className="text-2xl font-black text-foreground mb-2">No Counter Assigned</h3>
                 <p className="text-sm font-bold text-muted-foreground max-w-sm">You can monitor the office queue below, but you cannot serve tokens until assigned to a counter.</p>
              </div>
            )}
          </div>

          {/* Stats Area (Right) */}
          <div className="lg:col-span-4 flex flex-col gap-6 lg:gap-8">
             <div className="bg-background shadow-neu rounded-[2.5rem] p-8 border-0 flex-1 flex flex-col justify-center">
               <div className="flex items-center justify-between mb-4">
                 <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Waiting in Queue</p>
                   <p className="text-4xl font-black text-foreground tracking-tight">{data?.stats?.waitingCount || 0}</p>
                 </div>
                 <div className="h-14 w-14 rounded-2xl bg-background shadow-neu-inset flex items-center justify-center text-amber-500">
                   <Users size={24} />
                 </div>
               </div>
               <div className="bg-background shadow-neu-inset rounded-xl p-4 mt-2 flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Next Token:</span>
                 <span className="text-xs font-black text-foreground">{data?.nextTokens?.[0]?.tokenNumber || 'None'}</span>
               </div>
             </div>

             <div className="bg-background shadow-neu rounded-[2.5rem] p-8 border-0 flex-1 flex flex-col justify-center">
               <div className="flex items-center justify-between mb-4">
                 <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Completed Today</p>
                   <p className="text-4xl font-black text-foreground tracking-tight">{data?.stats?.completedToday || 0}</p>
                 </div>
                 <div className="h-14 w-14 rounded-2xl bg-background shadow-neu-inset flex items-center justify-center text-emerald-500">
                   <CheckCircle2 size={24} />
                 </div>
               </div>
               <div className="bg-background shadow-neu-inset rounded-xl p-4 mt-2 flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Avg Time:</span>
                 <span className="text-xs font-black text-foreground">{data?.stats?.avgServiceTime || '0.0'}m</span>
               </div>
             </div>
          </div>
        </div>
        
        {/* Next in Queue Table */}
        <div className="bg-background shadow-neu rounded-[2.5rem] border-0 overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
             <div className="w-10 h-10 bg-background shadow-neu-inset rounded-xl flex items-center justify-center text-primary">
                <Users size={18} />
             </div>
             <h2 className="text-lg font-black text-foreground">Next in Queue</h2>
          </div>
          
          <div className="p-4 sm:p-8 overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-3">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Token</th>
                  <th className="px-4 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Service</th>
                  <th className="px-4 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Wait Time</th>
                  <th className="px-4 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {data?.nextTokens && data.nextTokens.length > 0 ? (
                  data.nextTokens.map((item: any, i: number) => (
                    <tr key={item._id} className="group">
                      <td className="bg-background shadow-neu group-hover:shadow-neu-inset transition-all rounded-l-2xl px-6 py-4 font-black text-foreground">
                        {item.tokenNumber}
                      </td>
                      <td className="bg-background shadow-neu group-hover:shadow-neu-inset transition-all px-6 py-4 text-xs font-bold text-muted-foreground">
                        {item.serviceName}
                      </td>
                      <td className="bg-background shadow-neu group-hover:shadow-neu-inset transition-all px-6 py-4 text-xs font-bold text-muted-foreground">
                        {item.waitTime} mins
                      </td>
                      <td className="bg-background shadow-neu group-hover:shadow-neu-inset transition-all rounded-r-2xl px-6 py-4 text-right">
                        <button 
                          onClick={() => {
                            if (!data?.currentToken) handleAction('CALL_NEXT', item._id);
                          }}
                          disabled={i !== 0 || actionLoading || !!data?.currentToken} 
                          className={`h-10 px-6 rounded-xl text-[10px] font-black tracking-widest transition-all border-0 disabled:opacity-50 ${i === 0 && !data?.currentToken ? 'bg-primary shadow-lg shadow-primary/30 text-white hover:-translate-y-0.5' : 'bg-background shadow-neu hover:shadow-neu-hover text-primary'}`}
                        >
                          CALL NEXT
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="bg-background shadow-neu-inset rounded-2xl px-6 py-12 text-center text-xs font-bold text-muted-foreground">
                      No citizens waiting in the queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
