"use client";
import { useEffect, useState } from 'react';
import { Search, Filter, Loader2, Activity, Ticket, Building2, Briefcase, Hash } from 'lucide-react';
import Link from 'next/link';

export interface QueueHistoryToken {
  _id: string;
  tokenNumber: string;
  citizenName: string;
  serviceName: string;
  status: string;
  createdAt: string;
  endTime?: string;
}

export default function StaffQueueHistoryPage() {
  const [tokens, setTokens] = useState<QueueHistoryToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  const fetchHistoryData = async (page = 1, search = '', status = '') => {
    try {
      setLoading(true);
      const res = await fetch(`/api/staff/tokens?page=${page}&search=${search}&status=${status}`);
      const json = await res.json();
      if (json.success) {
        // Filter locally if backend doesn't support $in array for status query via GET params
        const allowedStatuses = ['COMPLETED', 'SKIPPED', 'NO_SHOW'];
        const filtered = json.data.filter((t: any) => allowedStatuses.includes(t.status));
        setTokens(status ? json.data : filtered);
        if (json.pagination) {
          setPagination(json.pagination);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryData(pagination.page, searchQuery, statusFilter);
  }, [pagination.page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchHistoryData(1, searchQuery, statusFilter);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchHistoryData(1, searchQuery, e.target.value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-purple-500';
      case 'NO_SHOW': return 'text-red-500';
      case 'SKIPPED': return 'text-amber-500';
      default: return 'text-slate-500';
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Queue History</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold mt-1">View all completed, skipped, and no-show tokens.</p>
        </div>
        
        <div className="flex items-center gap-2">
            <span className="h-12 px-6 bg-background shadow-neu-inset rounded-2xl text-xs uppercase font-black tracking-widest text-primary flex items-center justify-center transition-all border-0">
               {pagination.total} RESOLVED
            </span>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 space-y-6">
         {/* Filter Bar */}
         <div className="bg-background shadow-neu rounded-[2rem] p-4 flex flex-col md:flex-row gap-4 border-0">
            <form onSubmit={handleSearch} className="relative flex-1 group">
               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search size={18} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
               </div>
               <input 
                  type="text"
                  placeholder="Search token number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0 placeholder:text-muted-foreground/50"
               />
            </form>
            <div className="relative group min-w-[200px]">
               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <Filter size={16} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
               </div>
               <select 
                 value={statusFilter}
                 onChange={handleStatusChange}
                 className="w-full h-12 pl-12 pr-10 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl text-xs uppercase font-black tracking-widest text-foreground focus:outline-none transition-all border-0 appearance-none cursor-pointer"
               >
                 <option value="">All Resolved</option>
                 <option value="COMPLETED">Completed</option>
                 <option value="NO_SHOW">No Show</option>
                 <option value="SKIPPED">Skipped</option>
               </select>
               <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                     <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
               </div>
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
                     <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 text-right whitespace-nowrap">Resolved Time</th>
                     </tr>
                  </thead>
                  <tbody>
                     {loading ? (
                       <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                             <div className="flex flex-col items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                                <h3 className="text-sm font-black text-foreground">Loading history...</h3>
                             </div>
                          </td>
                       </tr>
                     ) : tokens.length === 0 ? (
                       <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                             <div className="flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-background shadow-neu rounded-[2rem] flex items-center justify-center mb-4 text-slate-300">
                                   <Activity size={24} />
                                </div>
                                <h3 className="text-sm font-black text-foreground">No history found</h3>
                             </div>
                          </td>
                       </tr>
                     ) : (
                       tokens.map((token: any) => (
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
                             <span className={`text-[10px] font-black uppercase tracking-widest ${getStatusColor(token.status)}`}>
                                {token.status}
                             </span>
                          </td>
                          <td className="px-6 py-5 border-b border-primary/5 transition-all text-right">
                             <span className="font-mono text-xs font-bold text-slate-400 bg-background shadow-neu-inset px-2 py-1 rounded-lg">
                                {token.endTime ? new Date(token.endTime).toLocaleString() : new Date(token.createdAt).toLocaleString()}
                             </span>
                          </td>
                       </tr>
                       ))
                     )}
                  </tbody>
               </table>
            </div>
            
            {/* Pagination Desktop */}
            {!loading && pagination.pages > 1 && (
               <div className="flex items-center justify-between mt-8">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                     Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                  </span>
                  <div className="flex gap-2">
                     <button 
                        disabled={pagination.page === 1}
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        className="h-10 px-4 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl text-[10px] font-black tracking-widest text-foreground disabled:opacity-50 transition-all border-0"
                     >
                        PREV
                     </button>
                     <button 
                        disabled={pagination.page === pagination.pages}
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        className="h-10 px-4 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl text-[10px] font-black tracking-widest text-foreground disabled:opacity-50 transition-all border-0"
                     >
                        NEXT
                     </button>
                  </div>
               </div>
            )}
         </div>

         {/* Mobile/Tablet Card View */}
         <div className="lg:hidden w-full space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
               {loading ? (
                 <div className="col-span-1 md:col-span-2 py-12 text-center text-muted-foreground font-bold text-sm bg-background shadow-neu-inset rounded-[2rem] flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                    <h3 className="text-sm font-black text-foreground">Loading history...</h3>
                 </div>
               ) : tokens.length === 0 ? (
                 <div className="col-span-1 md:col-span-2 py-12 text-center text-muted-foreground font-bold text-sm bg-background shadow-neu-inset rounded-[2rem] flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-background shadow-neu rounded-[2rem] flex items-center justify-center mb-4 text-slate-300">
                       <Activity size={24} />
                    </div>
                    <h3 className="text-sm font-black text-foreground">No history found</h3>
                 </div>
               ) : (
                 tokens.map((token: any) => (
                    <div key={token._id.toString()} className="bg-background shadow-neu rounded-3xl p-5 flex flex-col gap-4 border border-primary/5 relative overflow-hidden w-full">
                       <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                             <div className="w-12 h-12 rounded-xl bg-background shadow-neu-inset flex items-center justify-center text-primary shrink-0">
                                <Ticket size={20} />
                             </div>
                             <div className="min-w-0">
                                <h3 className="font-black text-lg text-foreground truncate tracking-wider">{token.tokenNumber}</h3>
                                <div className="flex items-center gap-1 mt-0.5 text-[11px] font-bold text-muted-foreground truncate">
                                   <span className={`text-[9px] font-black uppercase tracking-widest ${getStatusColor(token.status)}`}>
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
                       </div>
                       
                       <div className="flex justify-between items-center pt-2 border-t border-primary/5">
                          <span className="font-mono text-[10px] font-bold text-slate-400">
                             {token.endTime ? new Date(token.endTime).toLocaleTimeString() : new Date(token.createdAt).toLocaleTimeString()}
                          </span>
                       </div>
                    </div>
                 ))
               )}
            </div>

            {/* Pagination Mobile */}
            {!loading && pagination.pages > 1 && (
               <div className="flex flex-col items-center gap-4 mt-8 bg-background shadow-neu-inset p-4 rounded-[2rem]">
                  <div className="flex gap-4 w-full">
                     <button 
                        disabled={pagination.page === 1}
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        className="flex-1 h-12 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl text-[10px] font-black tracking-widest text-foreground disabled:opacity-50 transition-all border-0"
                     >
                        PREV
                     </button>
                     <button 
                        disabled={pagination.page === pagination.pages}
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        className="flex-1 h-12 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl text-[10px] font-black tracking-widest text-foreground disabled:opacity-50 transition-all border-0"
                     >
                        NEXT
                     </button>
                  </div>
               </div>
            )}
         </div>

      </div>
    </div>
  );
}
