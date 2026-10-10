"use client";
import { useEffect, useState } from 'react';
import { ChevronLeft, Search, Loader2, Activity, Ticket, Building2, Briefcase, Hash, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socketClient';

export interface QueueToken {
  _id: string;
  tokenNumber: string;
  citizenName: string;
  serviceName: string;
  priority: boolean;
  status: string;
  createdAt: string;
}

export default function StaffQueuePage() {
  const router = useRouter();
  const [tokens, setTokens] = useState<QueueToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchQueueData = async () => {
    try {
      const res = await fetch('/api/staff/queue');
      const json = await res.json();
      if (json.success) {
        setTokens(json.data);
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
          
          socket.on('queue:updated', () => fetchQueueData());
          socket.on('token:called', () => fetchQueueData());
        }
        await fetchQueueData();
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

  const filteredTokens = tokens.filter(t => 
    t.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.citizenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.serviceName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              Live Queue
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm font-semibold mt-1">Real-time view of all tokens currently waiting for your counter.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
            <span className="h-12 px-6 bg-background shadow-neu-inset rounded-2xl text-xs uppercase font-black tracking-widest text-primary flex items-center justify-center transition-all border-0">
               {filteredTokens.length} WAITING
            </span>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 space-y-6">
         {/* Filter Bar */}
         <div className="bg-background shadow-neu rounded-[2rem] p-4 flex flex-col md:flex-row gap-4 border-0">
            <div className="relative flex-1 group">
               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search size={18} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
               </div>
               <input 
                  type="text"
                  placeholder="Search token or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0 placeholder:text-muted-foreground/50"
               />
            </div>
         </div>

         {/* Desktop Table View */}
         <div className="hidden lg:block bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0">
            <div className="w-full overflow-x-auto custom-scrollbar pb-4 min-h-[400px]">
               <table className="w-full text-left">
                  <thead>
                     <tr>
                     <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Token Number</th>
                     <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Citizen</th>
                     <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Service</th>
                     <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Status</th>
                     <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 text-right whitespace-nowrap">Wait Time</th>
                     </tr>
                  </thead>
                  <tbody>
                     {loading ? (
                       <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                             <div className="flex flex-col items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                                <h3 className="text-sm font-black text-foreground">Loading queue...</h3>
                             </div>
                          </td>
                       </tr>
                     ) : filteredTokens.length === 0 ? (
                       <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                             <div className="flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-background shadow-neu rounded-[2rem] flex items-center justify-center mb-4 text-slate-300">
                                   <Activity size={24} />
                                </div>
                                <h3 className="text-sm font-black text-foreground">No tokens waiting</h3>
                             </div>
                          </td>
                       </tr>
                     ) : (
                       filteredTokens.map((token: any) => (
                       <tr key={token._id.toString()} className="group hover:bg-primary/5 transition-colors">
                          <td className="px-6 py-5 border-b border-primary/5 transition-all">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-background shadow-neu-inset flex items-center justify-center text-primary shrink-0">
                                   <Ticket size={16} />
                                </div>
                                <span className="font-black text-lg text-foreground whitespace-nowrap tracking-wider">{token.tokenNumber}</span>
                             </div>
                          </td>
                          <td className="px-6 py-5 border-b border-primary/5 transition-all font-semibold text-muted-foreground text-sm max-w-[150px] truncate">
                             {token.citizenName}
                          </td>
                          <td className="px-6 py-5 border-b border-primary/5 transition-all font-semibold text-muted-foreground text-sm max-w-[150px] truncate">
                             {token.serviceName}
                          </td>
                          <td className="px-6 py-5 border-b border-primary/5 transition-all">
                             <span className={`text-[10px] font-black uppercase tracking-widest ${token.status === 'WAITING' ? 'text-amber-500' : 'text-blue-500'}`}>
                                {token.status}
                             </span>
                          </td>
                          <td className="px-6 py-5 border-b border-primary/5 transition-all text-right">
                             <span className="font-mono text-xs font-bold text-slate-400 bg-background shadow-neu-inset px-2 py-1 rounded-lg inline-flex items-center">
                                <Clock size={10} className="mr-1" />
                                {Math.floor((Date.now() - new Date(token.createdAt).getTime()) / 60000)} mins
                             </span>
                          </td>
                       </tr>
                       ))
                     )}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Mobile/Tablet Card View */}
         <div className="lg:hidden w-full space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
               {loading ? (
                 <div className="col-span-1 md:col-span-2 py-12 text-center text-muted-foreground font-bold text-sm bg-background shadow-neu-inset rounded-[2rem] flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                    <h3 className="text-sm font-black text-foreground">Loading queue...</h3>
                 </div>
               ) : filteredTokens.length === 0 ? (
                 <div className="col-span-1 md:col-span-2 py-12 text-center text-muted-foreground font-bold text-sm bg-background shadow-neu-inset rounded-[2rem] flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-background shadow-neu rounded-[2rem] flex items-center justify-center mb-4 text-slate-300">
                       <Activity size={24} />
                    </div>
                    <h3 className="text-sm font-black text-foreground">No tokens waiting</h3>
                 </div>
               ) : (
                 filteredTokens.map((token: any) => (
                    <div key={token._id.toString()} className="bg-background shadow-neu rounded-3xl p-5 flex flex-col gap-4 border border-primary/5 relative overflow-hidden w-full">
                       <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                             <div className="w-12 h-12 rounded-xl bg-background shadow-neu-inset flex items-center justify-center text-primary shrink-0">
                                <Ticket size={20} />
                             </div>
                             <div className="min-w-0">
                                <h3 className="font-black text-lg text-foreground truncate tracking-wider">{token.tokenNumber}</h3>
                                <div className="flex items-center gap-1 mt-0.5 text-[11px] font-bold text-muted-foreground truncate">
                                   <span className={`text-[9px] font-black uppercase tracking-widest ${token.status === 'WAITING' ? 'text-amber-500' : 'text-blue-500'}`}>
                                      {token.status}
                                   </span>
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="h-px w-full bg-primary/5"></div>

                       <div className="flex flex-col gap-2 min-w-0">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                             <Hash size={12} className="text-indigo-400 shrink-0" />
                             <span className="truncate">{token.citizenName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                             <Briefcase size={12} className="text-emerald-400 shrink-0" />
                             <span className="truncate">{token.serviceName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                             <Clock size={12} className="text-amber-400 shrink-0" />
                             <span className="truncate">Waiting: {Math.floor((Date.now() - new Date(token.createdAt).getTime()) / 60000)} mins</span>
                          </div>
                       </div>
                       
                    </div>
                 ))
               )}
            </div>
         </div>

      </div>
    </div>
  );
}
