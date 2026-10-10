import { Search, Filter, Activity, Ticket, Building2, Briefcase, Hash } from 'lucide-react';
import dbConnect from '@/lib/db';
import { Token, TokenStatus } from '@/models/Token';
import { Office } from '@/models/Office';

async function getTokensByStatus(orgId: string | undefined | null, statuses: TokenStatus[]) {
  await dbConnect();
  
  let query: any = { status: { $in: statuses } };

  if (orgId) {
    const offices = await Office.find({ organizationId: orgId }).select('_id');
    const officeIds = offices.map(o => o._id);
    if (officeIds.length === 0) return [];
    query.officeId = { $in: officeIds };
  }
  
  const tokens = await Token.find(query)
    .populate('officeId')
    .populate('serviceId')
    .populate('counterId')
    .sort({ createdAt: -1 }); 
  return tokens;
}

export default async function QueueTable({ 
  orgId, 
  title, 
  description, 
  statuses 
}: { 
  orgId?: string | null; 
  title: string; 
  description: string; 
  statuses: TokenStatus[];
}) {
  const tokens = await getTokensByStatus(orgId, statuses);

  const getStatusColor = (status: string) => {
    switch (status) {
      case TokenStatus.SERVING: return 'text-blue-500';
      case TokenStatus.CALLED: return 'text-emerald-500';
      case TokenStatus.WAITING: return 'text-amber-500';
      case TokenStatus.COMPLETED: return 'text-purple-500';
      case TokenStatus.NO_SHOW: return 'text-red-500';
      default: return 'text-slate-500';
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold mt-1">{description}</p>
        </div>
        
        <div className="flex items-center gap-2">
            <span className="h-12 px-6 bg-background shadow-neu-inset rounded-2xl text-xs uppercase font-black tracking-widest text-primary flex items-center justify-center transition-all border-0">
               {tokens.length} TOKENS
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
                  placeholder="Search token number..."
                  className="w-full h-12 pl-12 pr-4 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0 placeholder:text-muted-foreground/50"
               />
            </div>
            <button className="h-12 px-6 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl text-xs uppercase font-black tracking-widest text-slate-500 hover:text-primary flex items-center justify-center transition-all border-0">
               <Filter size={16} className="mr-2" /> Filter by Office
            </button>
         </div>

         {/* Desktop Table View */}
         <div className="hidden lg:block bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0">
            <div className="w-full overflow-x-auto custom-scrollbar pb-4 min-h-[400px]">
               <table className="w-full text-left">
                  <thead>
                     <tr>
                     <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Token Number</th>
                     <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Office</th>
                     <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Service</th>
                     <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Counter</th>
                     <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Status</th>
                     <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 text-right whitespace-nowrap">Generated At</th>
                     </tr>
                  </thead>
                  <tbody>
                     {tokens.map((token: any) => (
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
                           {token.officeId ? token.officeId.name : '-'}
                        </td>
                        <td className="px-6 py-5 border-b border-primary/5 transition-all font-semibold text-muted-foreground text-sm max-w-[150px] truncate">
                           {token.serviceId ? token.serviceId.name : '-'}
                        </td>
                        <td className="px-6 py-5 border-b border-primary/5 transition-all font-semibold text-foreground text-sm">
                           {token.counterId ? token.counterId.name : 'Waiting'}
                        </td>
                        <td className="px-6 py-5 border-b border-primary/5 transition-all">
                           <span className={`text-[10px] font-black uppercase tracking-widest ${getStatusColor(token.status)}`}>
                              {token.status}
                           </span>
                        </td>
                        <td className="px-6 py-5 border-b border-primary/5 transition-all text-right">
                           <span className="font-mono text-xs font-bold text-slate-400 bg-background shadow-neu-inset px-2 py-1 rounded-lg">
                              {new Date(token.createdAt).toLocaleTimeString()}
                           </span>
                        </td>
                     </tr>
                     ))}
                     
                     {tokens.length === 0 && (
                     <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                           <div className="flex flex-col items-center justify-center">
                              <div className="w-16 h-16 bg-background shadow-neu rounded-full flex items-center justify-center mb-4 text-slate-300">
                                 <Activity size={24} />
                              </div>
                              <h3 className="text-sm font-black text-foreground">No tokens found</h3>
                           </div>
                        </td>
                     </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Mobile/Tablet Card View */}
         <div className="lg:hidden w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
               {tokens.map((token: any) => (
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
                           <Building2 size={12} className="text-indigo-400 shrink-0" />
                           <span className="truncate">{token.officeId ? token.officeId.name : '-'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                           <Briefcase size={12} className="text-emerald-400 shrink-0" />
                           <span className="truncate">{token.serviceId ? token.serviceId.name : '-'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                           <Hash size={12} className="text-amber-400 shrink-0" />
                           <span className="truncate font-black">{token.counterId ? token.counterId.name : 'Waiting'}</span>
                        </div>
                     </div>
                     
                     <div className="flex justify-end pt-2 border-t border-primary/5">
                        <span className="font-mono text-[10px] font-bold text-slate-400">
                           {new Date(token.createdAt).toLocaleTimeString()}
                        </span>
                     </div>
                  </div>
               ))}

               {tokens.length === 0 && (
                  <div className="col-span-1 md:col-span-2 py-12 text-center text-muted-foreground font-bold text-sm bg-background shadow-neu-inset rounded-[2rem] flex flex-col items-center justify-center">
                     <div className="w-16 h-16 bg-background shadow-neu rounded-full flex items-center justify-center mb-4 text-slate-300">
                        <Activity size={24} />
                     </div>
                     <h3 className="text-sm font-black text-foreground">No tokens found</h3>
                  </div>
               )}
            </div>
         </div>

      </div>
    </div>
  );
}
