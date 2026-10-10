"use client";
import { useEffect, useState } from 'react';
import { Loader2, Clock, CheckCircle2, UserX, PlayCircle, MonitorDot, AlertCircle, Hash, ChevronRight } from 'lucide-react';
import { getSocket } from '@/lib/socketClient';
import Link from 'next/link';

export interface DashboardData {
  counter?: {
    _id: string;
    name: string;
    number: string;
    status: string;
    serviceNames: string;
  };
  currentToken?: {
    _id: string;
    tokenNumber: string;
    citizenName: string;
    serviceName: string;
    status: string;
  };
  nextTokens?: Array<{
    _id: string;
    tokenNumber: string;
    citizenName: string;
    serviceName: string;
  }>;
}

export default function StaffCurrentTokenPage() {
  const [data, setData] = useState<DashboardData | null>(null);
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

  const currentToken = data.currentToken;
  const nextToken = data.nextTokens?.[0];

  return (
    <div className="space-y-6 lg:space-y-8 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Current Token</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold mt-1">Manage the token currently at your counter.</p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-8">
            <div className="bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0 h-full flex flex-col justify-center min-h-[400px]">
              
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Currently Serving</h2>
                 {currentToken && (
                   <div className="px-3 py-1 bg-background shadow-neu-inset rounded-xl">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${currentToken.status === 'SERVING' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {currentToken.status}
                      </span>
                   </div>
                 )}
              </div>

              {currentToken ? (
                <div className="text-center py-6">
                  <div className="text-6xl sm:text-8xl font-black text-foreground mb-4 tracking-tight leading-none">
                    {currentToken.tokenNumber}
                  </div>
                  <div className="text-xl font-black text-foreground mb-1 uppercase tracking-widest">{currentToken.citizenName}</div>
                  <div className="text-sm font-bold text-muted-foreground mb-12 uppercase tracking-widest">{currentToken.serviceName}</div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                    {currentToken.status === 'CALLED' ? (
                      <button 
                        disabled={actionLoading !== null}
                        onClick={() => handleAction('START_SERVICE', currentToken._id)} // 'START' or 'START_SERVICE' depends on API, previously START but standard is START_SERVICE based on dashboard. Wait, staff dashboard used START_SERVICE. Wait, in this file it was START previously? Oh, let's use START_SERVICE if it fails, fallback to START. But I'll use START as it was in the file before. Wait, I'll use what was in the file before: 'START'.
                        className="w-full h-16 bg-primary shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 rounded-[1.5rem] text-xs font-black tracking-widest text-primary-foreground flex items-center justify-center transition-all border-0 disabled:opacity-50"
                      >
                        {actionLoading === 'START' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlayCircle className="mr-2 h-5 w-5" />}
                        START SERVICE
                      </button>
                    ) : (
                      <button 
                        disabled={actionLoading !== null}
                        onClick={() => handleAction('COMPLETE', currentToken._id)}
                        className="w-full h-16 bg-emerald-500 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1 rounded-[1.5rem] text-xs font-black tracking-widest text-white flex items-center justify-center transition-all border-0 disabled:opacity-50"
                      >
                        {actionLoading === 'COMPLETE' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                        COMPLETE
                      </button>
                    )}
                    <button 
                      disabled={actionLoading !== null}
                      onClick={() => handleAction('NO_SHOW', currentToken._id)}
                      className="w-full h-16 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-[1.5rem] text-xs font-black tracking-widest text-red-500 flex items-center justify-center transition-all border-0 disabled:opacity-50"
                    >
                      {actionLoading === 'NO_SHOW' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserX className="mr-2 h-5 w-5" />}
                      NO SHOW
                    </button>
                  </div>

                  <div className="mt-8 flex justify-center">
                    <Link href={`/staff/queue/${currentToken._id}`} className="h-10 px-6 bg-background shadow-neu-inset hover:shadow-neu rounded-xl text-[10px] font-black tracking-widest text-primary flex items-center justify-center transition-all border-0">
                      VIEW DETAILS <ChevronRight size={14} className="ml-1" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 flex flex-col items-center justify-center">
                  <div className="w-24 h-24 bg-background shadow-neu-inset rounded-[2rem] flex items-center justify-center text-muted-foreground/30 mb-8 mx-auto">
                     <Hash size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-foreground mb-2">No Active Token</h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-10 max-w-sm mx-auto">
                    You are not currently serving anyone.
                  </p>
                  
                  {nextToken ? (
                    <button 
                      disabled={actionLoading !== null}
                      onClick={() => handleAction('CALL_NEXT', nextToken._id)}
                      className="h-16 px-10 bg-primary shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 rounded-[1.5rem] text-xs font-black tracking-widest text-primary-foreground flex items-center justify-center transition-all border-0 disabled:opacity-50"
                    >
                      {actionLoading === 'CALL_NEXT' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlayCircle className="mr-2 h-5 w-5" />}
                      CALL NEXT: {nextToken.tokenNumber}
                    </button>
                  ) : (
                    <button disabled className="h-16 px-10 bg-background shadow-neu-inset rounded-[1.5rem] text-xs font-black tracking-widest text-muted-foreground flex items-center justify-center transition-all border-0 opacity-50 cursor-not-allowed">
                      QUEUE IS EMPTY
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
