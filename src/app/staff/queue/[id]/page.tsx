"use client";
import { useState, useEffect, use } from 'react';
import { Loader2, AlertCircle, ChevronLeft, Clock, PlayCircle, CheckCircle2, UserX, SkipForward, Hash, Building2, Briefcase, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export default function StaffTokenDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [token, setToken] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTokenData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/staff/tokens/${id}`);
      const json = await response.json();
      
      if (json.success && json.data) {
        setToken(json.data);
      } else {
        setError(json.message || "Token not found.");
      }
    } catch (err) {
      setError("Failed to load token data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenData();
  }, [id]);

  const handleAction = async (action: string) => {
    try {
      setActionLoading(action);
      const res = await fetch('/api/staff/token/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, tokenId: id })
      });
      const data = await res.json();
      if (data.success) {
        await fetchTokenData();
      } else {
        alert(data.message || 'Action failed');
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

  if (error || !token) {
    return (
      <div className="flex justify-center items-center h-[50vh] cursor-default max-w-xl mx-auto">
        <div className="bg-background shadow-neu rounded-[2.5rem] p-12 text-center border-0 w-full flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-background shadow-neu-inset rounded-[2rem] flex items-center justify-center text-red-500 mb-6 mx-auto">
             <AlertCircle size={32} />
          </div>
          <h3 className="text-2xl font-black text-foreground mb-2">Token Not Found</h3>
          <p className="text-sm font-bold text-muted-foreground mb-8">
            {error || "The token you are looking for does not exist."}
          </p>
          <button 
            onClick={() => router.back()} 
            className="h-12 px-8 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl text-xs font-black tracking-widest text-primary transition-all border-0 flex items-center justify-center"
          >
            <ChevronLeft size={16} className="mr-2" /> GO BACK
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WAITING': return 'text-amber-500';
      case 'CHECKED_IN': return 'text-blue-500';
      case 'CALLED': return 'text-indigo-500';
      case 'SERVING': return 'text-purple-500';
      case 'COMPLETED': return 'text-emerald-500';
      case 'NO_SHOW': return 'text-red-500';
      case 'SKIPPED': return 'text-slate-500';
      default: return 'text-slate-500';
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="w-12 h-12 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-[1.5rem] flex items-center justify-center text-primary transition-all border-0 shrink-0"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
              Token {token.tokenNumber}
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm font-semibold mt-1">Detailed information and actions for this token.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
            <span className={`h-12 px-6 bg-background shadow-neu-inset rounded-2xl text-xs uppercase font-black tracking-widest flex items-center justify-center transition-all border-0 ${getStatusColor(token.status)}`}>
               {token.status.replace('_', ' ')}
            </span>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          <div className="lg:col-span-8 space-y-6 lg:space-y-8">
            
            {/* Token Information */}
            <div className="bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0 flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 bg-background shadow-neu-inset rounded-2xl flex items-center justify-center text-primary shrink-0">
                    <Hash size={20} />
                 </div>
                 <div>
                    <h2 className="text-lg font-black text-foreground">Token Information</h2>
                    <p className="text-xs font-bold text-muted-foreground mt-1">Citizen and service details</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="bg-background shadow-neu-inset rounded-[2rem] p-6 flex flex-col justify-center">
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Citizen Name</p>
                   <p className="text-sm font-bold text-foreground">{token.citizenId?.fullName || 'Walk-in Citizen'}</p>
                 </div>

                 <div className="bg-background shadow-neu-inset rounded-[2rem] p-6 flex flex-col justify-center">
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Citizen Contact</p>
                   <p className="text-sm font-bold text-foreground">{token.citizenId?.mobile || token.citizenId?.email || 'N/A'}</p>
                 </div>

                 <div className="bg-background shadow-neu-inset rounded-[2rem] p-6 flex flex-col justify-center">
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Service</p>
                   <p className="text-sm font-bold text-foreground">{token.serviceId?.name}</p>
                 </div>

                 <div className="bg-background shadow-neu-inset rounded-[2rem] p-6 flex flex-col justify-center">
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Priority</p>
                   <p className={`text-sm font-black ${token.priority === 'HIGH' ? 'text-red-500' : 'text-foreground'}`}>{token.priority || 'NORMAL'}</p>
                 </div>

                 <div className="bg-background shadow-neu-inset rounded-[2rem] p-6 flex flex-col justify-center">
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Office</p>
                   <p className="text-sm font-bold text-foreground">{token.officeId?.name}</p>
                 </div>

                 <div className="bg-background shadow-neu-inset rounded-[2rem] p-6 flex flex-col justify-center">
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Counter</p>
                   <p className="text-sm font-bold text-foreground">{token.counterId?.name}</p>
                 </div>

                 {token.processingTime && (
                   <div className="bg-background shadow-neu-inset rounded-[2rem] p-6 flex flex-col justify-center sm:col-span-2">
                     <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Processing Time</p>
                     <p className="text-lg font-black text-primary">{Math.floor(token.processingTime / 60)}m {token.processingTime % 60}s</p>
                   </div>
                 )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0 flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 bg-background shadow-neu-inset rounded-2xl flex items-center justify-center text-indigo-500 shrink-0">
                    <Clock size={20} />
                 </div>
                 <div>
                    <h2 className="text-lg font-black text-foreground">Timeline Events</h2>
                    <p className="text-xs font-bold text-muted-foreground mt-1">Chronological history of this token</p>
                 </div>
              </div>

              <div className="space-y-6">
                {token.events && token.events.map((event: any, idx: number) => (
                  <div key={idx} className="flex gap-4 group">
                    <div className="flex flex-col items-center">
                      <div className="h-4 w-4 rounded-full bg-background shadow-neu-inset flex items-center justify-center border-2 border-primary/20 group-hover:border-primary transition-colors shrink-0 z-10">
                         <div className="h-2 w-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors"></div>
                      </div>
                      {idx !== token.events.length - 1 && (
                        <div className="w-0.5 h-full bg-primary/10 group-hover:bg-primary/20 transition-colors my-1" />
                      )}
                    </div>
                    <div className="pb-4 pt-0.5">
                      <p className="text-sm font-black uppercase tracking-widest text-foreground">{event.type.replace('_', ' ')}</p>
                      <p className="text-xs font-bold text-muted-foreground mt-1 mb-2">{event.note}</p>
                      <p className="text-[10px] font-bold text-slate-400 font-mono bg-background shadow-neu-inset px-2 py-1 rounded-lg inline-block">{formatDate(event.time)}</p>
                    </div>
                  </div>
                ))}
                
                {(!token.events || token.events.length === 0) && (
                  <div className="bg-background shadow-neu-inset rounded-[2rem] p-8 text-center">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No events recorded yet.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className="lg:col-span-4 space-y-6 lg:space-y-8">
            {/* Actions */}
            <div className="bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0 flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 bg-background shadow-neu-inset rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
                    <Activity size={20} />
                 </div>
                 <div>
                    <h2 className="text-lg font-black text-foreground">Actions</h2>
                    <p className="text-xs font-bold text-muted-foreground mt-1">Manage token status</p>
                 </div>
              </div>

              <div className="space-y-4">
                {(token.status === 'WAITING' || token.status === 'CHECKED_IN') && (
                  <button 
                    disabled={actionLoading !== null}
                    onClick={() => handleAction('CALL_NEXT')}
                    className="w-full h-16 bg-primary shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 rounded-[1.5rem] text-xs font-black tracking-widest text-primary-foreground flex items-center justify-center transition-all border-0 disabled:opacity-50"
                  >
                    {actionLoading === 'CALL_NEXT' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlayCircle className="mr-2 h-5 w-5" />}
                    CALL TO COUNTER
                  </button>
                )}
                
                {token.status === 'CALLED' && (
                  <button 
                    disabled={actionLoading !== null}
                    onClick={() => handleAction('START')}
                    className="w-full h-16 bg-indigo-500 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1 rounded-[1.5rem] text-xs font-black tracking-widest text-white flex items-center justify-center transition-all border-0 disabled:opacity-50"
                  >
                    {actionLoading === 'START' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Clock className="mr-2 h-5 w-5" />}
                    START SERVICE
                  </button>
                )}

                {token.status === 'SERVING' && (
                  <button 
                    disabled={actionLoading !== null}
                    onClick={() => handleAction('COMPLETE')}
                    className="w-full h-16 bg-emerald-500 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1 rounded-[1.5rem] text-xs font-black tracking-widest text-white flex items-center justify-center transition-all border-0 disabled:opacity-50"
                  >
                    {actionLoading === 'COMPLETE' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                    COMPLETE SERVICE
                  </button>
                )}

                {(token.status === 'CALLED' || token.status === 'WAITING' || token.status === 'CHECKED_IN') && (
                  <button 
                    disabled={actionLoading !== null}
                    onClick={() => handleAction('NO_SHOW')}
                    className="w-full h-16 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-[1.5rem] text-xs font-black tracking-widest text-red-500 flex items-center justify-center transition-all border-0 disabled:opacity-50"
                  >
                    {actionLoading === 'NO_SHOW' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserX className="mr-2 h-5 w-5" />}
                    MARK NO SHOW
                  </button>
                )}

                {(token.status === 'WAITING' || token.status === 'CHECKED_IN') && (
                  <button 
                    disabled={actionLoading !== null}
                    onClick={() => handleAction('SKIP')}
                    className="w-full h-16 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-[1.5rem] text-xs font-black tracking-widest text-foreground flex items-center justify-center transition-all border-0 disabled:opacity-50"
                  >
                    {actionLoading === 'SKIP' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <SkipForward className="mr-2 h-5 w-5" />}
                    SKIP TOKEN
                  </button>
                )}

                {['COMPLETED', 'NO_SHOW', 'SKIPPED'].includes(token.status) && (
                  <div className="bg-background shadow-neu-inset rounded-[2rem] p-6 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      This token is inactive and cannot be modified.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
