"use client";
import { useEffect, useState } from 'react';
import { Loader2, MonitorDot, PauseCircle, PlayCircle, PowerOff, Shield, Activity, Hash, Briefcase } from 'lucide-react';
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
      <div className="flex justify-center items-center h-[50vh] cursor-default">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

  if (!data || !data.counter) {
    return (
      <div className="flex justify-center items-center h-[50vh] cursor-default max-w-xl mx-auto">
        <div className="bg-background shadow-neu rounded-[2.5rem] p-12 text-center border-0 w-full flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-background shadow-neu-inset rounded-[2rem] flex items-center justify-center text-muted-foreground/50 mb-6 mx-auto">
             <MonitorDot size={32} />
          </div>
          <h3 className="text-2xl font-black text-foreground mb-2">No Counter Assigned</h3>
          <p className="text-sm font-bold text-muted-foreground max-w-sm">
            You have not been assigned to a counter yet. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  const { counter, currentToken, stats } = data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-emerald-500';
      case 'PAUSED': return 'text-amber-500';
      case 'OFFLINE': return 'text-slate-500';
      default: return 'text-slate-500';
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">My Counter</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold mt-1">View details and manage the operational status of your counter.</p>
        </div>
        
        <div className="flex items-center gap-2">
            <span className={`h-12 px-6 bg-background shadow-neu-inset rounded-2xl text-xs uppercase font-black tracking-widest flex items-center justify-center transition-all border-0 ${getStatusColor(counter.status)}`}>
               <span className={`flex h-2 w-2 rounded-full mr-2 ${counter.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : counter.status === 'PAUSED' ? 'bg-amber-500' : 'bg-slate-400'}`}></span>
               {counter.status}
            </span>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          
          {/* Counter Details */}
          <div className="bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0 flex flex-col">
            <div className="flex items-center gap-4 mb-8">
               <div className="w-12 h-12 bg-background shadow-neu-inset rounded-2xl flex items-center justify-center text-primary shrink-0">
                  <MonitorDot size={20} />
               </div>
               <div>
                  <h2 className="text-lg font-black text-foreground">Counter Details</h2>
                  <p className="text-xs font-bold text-muted-foreground mt-1">Information about your current assignment</p>
               </div>
            </div>

            <div className="space-y-4 flex-1">
               <div className="bg-background shadow-neu-inset rounded-[2rem] p-6 flex items-center gap-4">
                 <div className="w-10 h-10 bg-background shadow-neu rounded-xl flex items-center justify-center text-indigo-500 shrink-0">
                    <Hash size={16} />
                 </div>
                 <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Counter Number</p>
                   <p className="text-sm font-bold text-foreground">{counter.number}</p>
                 </div>
               </div>

               <div className="bg-background shadow-neu-inset rounded-[2rem] p-6 flex items-center gap-4">
                 <div className="w-10 h-10 bg-background shadow-neu rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                    <Briefcase size={16} />
                 </div>
                 <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Assigned Services</p>
                   <p className="text-sm font-bold text-foreground">{counter.serviceNames}</p>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-background shadow-neu-inset rounded-[2rem] p-6 flex flex-col items-center justify-center text-center">
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Currently Serving</p>
                   <p className="text-2xl font-black text-primary">{currentToken ? currentToken.tokenNumber : 'None'}</p>
                 </div>
                 <div className="bg-background shadow-neu-inset rounded-[2rem] p-6 flex flex-col items-center justify-center text-center">
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Tokens Waiting</p>
                   <p className="text-2xl font-black text-amber-500">{stats.waitingCount}</p>
                 </div>
               </div>
            </div>
          </div>

          {/* Counter Status */}
          <div className="bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0 flex flex-col">
            <div className="flex items-center gap-4 mb-8">
               <div className="w-12 h-12 bg-background shadow-neu-inset rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
                  <Activity size={20} />
               </div>
               <div>
                  <h2 className="text-lg font-black text-foreground">Operational Status</h2>
                  <p className="text-xs font-bold text-muted-foreground mt-1">Manage the availability of your counter</p>
               </div>
            </div>

            <div className="space-y-6 flex-1 flex flex-col justify-center">
              <button 
                disabled={counter.status === 'ACTIVE' || statusLoading !== null}
                onClick={() => updateCounterStatus('ACTIVE')}
                className={`w-full h-20 rounded-[1.5rem] flex items-center px-8 transition-all border-0 ${counter.status === 'ACTIVE' ? 'bg-emerald-500/10 shadow-neu-inset text-emerald-500 cursor-default opacity-100' : 'bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset text-foreground'}`}
              >
                {statusLoading === 'ACTIVE' ? <Loader2 className="mr-6 h-6 w-6 animate-spin text-emerald-500" /> : <PlayCircle className={`mr-6 h-6 w-6 ${counter.status === 'ACTIVE' ? 'text-emerald-500' : 'text-muted-foreground'}`} />}
                <div className="text-left">
                  <span className={`block text-sm font-black uppercase tracking-widest mb-1 ${counter.status === 'ACTIVE' ? 'text-emerald-500' : ''}`}>Set Active</span>
                  <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ready to serve citizens</span>
                </div>
              </button>
              
              <button 
                disabled={counter.status === 'PAUSED' || statusLoading !== null}
                onClick={() => updateCounterStatus('PAUSED')}
                className={`w-full h-20 rounded-[1.5rem] flex items-center px-8 transition-all border-0 ${counter.status === 'PAUSED' ? 'bg-amber-500/10 shadow-neu-inset text-amber-500 cursor-default opacity-100' : 'bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset text-foreground'}`}
              >
                {statusLoading === 'PAUSED' ? <Loader2 className="mr-6 h-6 w-6 animate-spin text-amber-500" /> : <PauseCircle className={`mr-6 h-6 w-6 ${counter.status === 'PAUSED' ? 'text-amber-500' : 'text-muted-foreground'}`} />}
                <div className="text-left">
                  <span className={`block text-sm font-black uppercase tracking-widest mb-1 ${counter.status === 'PAUSED' ? 'text-amber-500' : ''}`}>Pause Counter</span>
                  <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Temporarily stop new assignments</span>
                </div>
              </button>

              <button 
                disabled={counter.status === 'OFFLINE' || statusLoading !== null}
                onClick={() => updateCounterStatus('OFFLINE')}
                className={`w-full h-20 rounded-[1.5rem] flex items-center px-8 transition-all border-0 ${counter.status === 'OFFLINE' ? 'bg-slate-500/10 shadow-neu-inset text-slate-500 cursor-default opacity-100' : 'bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset text-foreground'}`}
              >
                {statusLoading === 'OFFLINE' ? <Loader2 className="mr-6 h-6 w-6 animate-spin text-slate-500" /> : <PowerOff className={`mr-6 h-6 w-6 ${counter.status === 'OFFLINE' ? 'text-slate-500' : 'text-muted-foreground'}`} />}
                <div className="text-left">
                  <span className={`block text-sm font-black uppercase tracking-widest mb-1 ${counter.status === 'OFFLINE' ? 'text-slate-500' : ''}`}>Take Offline</span>
                  <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Close counter for the day</span>
                </div>
              </button>

              {counter.status === 'PAUSED' && (
                <div className="mt-4 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3 text-amber-600">
                  <Shield size={16} className="mt-0.5 shrink-0" />
                  <p className="text-xs font-bold leading-relaxed">
                    Your counter is paused. You will not receive new walk-in citizens or auto-assignments until you resume.
                  </p>
                </div>
              )}
              
              {counter.status === 'OFFLINE' && (
                <div className="mt-4 bg-slate-500/10 border border-slate-500/20 p-4 rounded-xl flex items-start gap-3 text-slate-600">
                  <Shield size={16} className="mt-0.5 shrink-0" />
                  <p className="text-xs font-bold leading-relaxed">
                    Your counter is completely offline. This counter is invisible to citizens in the live queue displays.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
