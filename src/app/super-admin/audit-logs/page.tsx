"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Search, Filter, Calendar, ChevronLeft, ChevronRight, Eye, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  
  // Filters
  const [action, setAction] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [role, setRole] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(action && action !== 'ALL' && { action }),
        ...(moduleFilter && moduleFilter !== 'ALL' && { module: moduleFilter }),
        ...(role && role !== 'ALL' && { role }),
        ...(statusFilter && statusFilter !== 'ALL' && { status: statusFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const res = await fetch(`/api/audit-logs?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
        setTotalPages(data.pagination.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, debouncedSearch, action, moduleFilter, role, statusFilter, startDate, endDate]);

  const getActionColor = (act: string) => {
    if (act.includes('CREATE')) return 'text-blue-500';
    if (act.includes('UPDATE')) return 'text-amber-500';
    if (act.includes('DELETE') || act.includes('FAILED')) return 'text-red-500';
    if (act.includes('LOGIN')) return 'text-green-500';
    return 'text-slate-500';
  };

  return (
    <div className="space-y-6 lg:space-y-8 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold mt-1">Track all system activities and security events.</p>
        </div>
        
        <button 
          onClick={fetchLogs} 
          className="h-12 px-6 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl text-xs uppercase font-black tracking-widest text-slate-500 hover:text-foreground flex items-center justify-center transition-all border-0"
        >
           REFRESH
        </button>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 space-y-6">
         {/* Search and Filter Bar */}
         <div className="bg-background shadow-neu rounded-[2rem] p-4 flex flex-col md:flex-row gap-4 border-0">
            <div className="relative flex-1 group">
               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search size={18} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
               </div>
               <input 
                  type="text"
                  placeholder="Search logs..."
                  className="w-full h-12 pl-12 pr-4 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0 placeholder:text-muted-foreground/50"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
               />
            </div>

            <div className="flex gap-4">
               <div className="flex items-center gap-2 bg-background shadow-neu-inset rounded-2xl px-4 h-12">
                  <Calendar size={16} className="text-slate-500 shrink-0" />
                  <input 
                     type="date" 
                     className="text-xs font-bold bg-transparent border-none focus:ring-0 outline-none w-28 text-foreground uppercase tracking-wider"
                     value={startDate}
                     onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                  />
                  <span className="text-muted-foreground">-</span>
                  <input 
                     type="date" 
                     className="text-xs font-bold bg-transparent border-none focus:ring-0 outline-none w-28 text-foreground uppercase tracking-wider"
                     value={endDate}
                     onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                  />
               </div>

               <button 
                  className={`h-12 px-6 rounded-2xl text-xs uppercase font-black tracking-widest flex items-center justify-center transition-all border-0 ${showFilters ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset text-slate-500 hover:text-primary'}`}
                  onClick={() => setShowFilters(!showFilters)}
               >
                  <Filter size={16} className="mr-2" /> Filters
               </button>
            </div>
         </div>

         {/* Advanced Filters */}
         {showFilters && (
            <div className="bg-background shadow-neu rounded-[2rem] p-6 border-0 grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Action</label>
                  <Select value={action} onValueChange={(v: any) => { setAction(v); setPage(1); }}>
                     <SelectTrigger className="w-full h-12 pl-4 pr-4 bg-background shadow-neu-inset rounded-2xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0">
                     <SelectValue placeholder="All Actions" />
                     </SelectTrigger>
                     <SelectContent className="bg-background shadow-neu border-0 rounded-2xl">
                     <SelectItem value="ALL" className="text-xs font-bold focus:bg-primary/5 cursor-pointer rounded-xl my-1">All Actions</SelectItem>
                     <SelectItem value="LOGIN" className="text-xs font-bold focus:bg-primary/5 cursor-pointer rounded-xl my-1">LOGIN</SelectItem>
                     <SelectItem value="LOGIN_FAILED" className="text-xs font-bold focus:bg-primary/5 cursor-pointer rounded-xl my-1">LOGIN_FAILED</SelectItem>
                     <SelectItem value="CREATE" className="text-xs font-bold focus:bg-primary/5 cursor-pointer rounded-xl my-1">CREATE</SelectItem>
                     <SelectItem value="UPDATE" className="text-xs font-bold focus:bg-primary/5 cursor-pointer rounded-xl my-1">UPDATE</SelectItem>
                     <SelectItem value="DELETE" className="text-xs font-bold focus:bg-primary/5 cursor-pointer rounded-xl my-1">DELETE</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Module</label>
                  <Select value={moduleFilter} onValueChange={(v: any) => { setModuleFilter(v); setPage(1); }}>
                     <SelectTrigger className="w-full h-12 pl-4 pr-4 bg-background shadow-neu-inset rounded-2xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0">
                     <SelectValue placeholder="All Modules" />
                     </SelectTrigger>
                     <SelectContent className="bg-background shadow-neu border-0 rounded-2xl">
                     <SelectItem value="ALL" className="text-xs font-bold focus:bg-primary/5 cursor-pointer rounded-xl my-1">All Modules</SelectItem>
                     <SelectItem value="Authentication" className="text-xs font-bold focus:bg-primary/5 cursor-pointer rounded-xl my-1">Authentication</SelectItem>
                     <SelectItem value="Organizations" className="text-xs font-bold focus:bg-primary/5 cursor-pointer rounded-xl my-1">Organizations</SelectItem>
                     <SelectItem value="Offices" className="text-xs font-bold focus:bg-primary/5 cursor-pointer rounded-xl my-1">Offices</SelectItem>
                     <SelectItem value="Users" className="text-xs font-bold focus:bg-primary/5 cursor-pointer rounded-xl my-1">Users</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Role</label>
                  <Select value={role} onValueChange={(v: any) => { setRole(v); setPage(1); }}>
                     <SelectTrigger className="w-full h-12 pl-4 pr-4 bg-background shadow-neu-inset rounded-2xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0">
                     <SelectValue placeholder="All Roles" />
                     </SelectTrigger>
                     <SelectContent className="bg-background shadow-neu border-0 rounded-2xl">
                     <SelectItem value="ALL" className="text-xs font-bold focus:bg-primary/5 cursor-pointer rounded-xl my-1">All Roles</SelectItem>
                     <SelectItem value="SUPER_ADMIN" className="text-xs font-bold focus:bg-primary/5 cursor-pointer rounded-xl my-1">SUPER_ADMIN</SelectItem>
                     <SelectItem value="ADMIN" className="text-xs font-bold focus:bg-primary/5 cursor-pointer rounded-xl my-1">ADMIN</SelectItem>
                     <SelectItem value="STAFF" className="text-xs font-bold focus:bg-primary/5 cursor-pointer rounded-xl my-1">STAFF</SelectItem>
                     <SelectItem value="CITIZEN" className="text-xs font-bold focus:bg-primary/5 cursor-pointer rounded-xl my-1">CITIZEN</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Status</label>
                  <Select value={statusFilter} onValueChange={(v: any) => { setStatusFilter(v); setPage(1); }}>
                     <SelectTrigger className="w-full h-12 pl-4 pr-4 bg-background shadow-neu-inset rounded-2xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0">
                     <SelectValue placeholder="All Status" />
                     </SelectTrigger>
                     <SelectContent className="bg-background shadow-neu border-0 rounded-2xl">
                     <SelectItem value="ALL" className="text-xs font-bold focus:bg-primary/5 cursor-pointer rounded-xl my-1">All Status</SelectItem>
                     <SelectItem value="SUCCESS" className="text-xs font-bold focus:bg-primary/5 cursor-pointer rounded-xl my-1">SUCCESS</SelectItem>
                     <SelectItem value="FAILED" className="text-xs font-bold focus:bg-primary/5 cursor-pointer rounded-xl my-1">FAILED</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
               <div className="md:col-span-4 flex justify-end">
                  <button 
                     onClick={() => { setAction(''); setModuleFilter(''); setRole(''); setStatusFilter(''); setStartDate(''); setEndDate(''); setPage(1); }} 
                     className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors uppercase tracking-widest px-4 py-2"
                  >
                     Clear Filters
                  </button>
               </div>
            </div>
         )}

         {/* Logs Table */}
         <div className="bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0">
            <div className="w-full overflow-x-auto custom-scrollbar pb-4 min-h-[400px]">
               <table className="w-full text-left">
               <thead>
                  <tr>
                     <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Timestamp</th>
                     <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Action</th>
                     <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Module</th>
                     <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">User</th>
                     <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Status</th>
                     <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">IP Address</th>
                  </tr>
               </thead>
               <tbody>
                  {loading && logs.length === 0 ? (
                     <tr>
                     <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground font-bold text-sm">Loading audit logs...</td>
                     </tr>
                  ) : logs.length === 0 ? (
                     <tr>
                     <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground font-bold text-sm">No audit logs found.</td>
                     </tr>
                  ) : (
                     logs.map((log: any) => (
                     <tr 
                        key={log._id} 
                        className="group hover:bg-primary/5 transition-colors cursor-pointer"
                        onClick={() => setSelectedLog(log)}
                     >
                        <td className="px-6 py-5 border-b border-primary/5 transition-all">
                           <span className="font-mono text-xs font-bold text-slate-500 whitespace-nowrap bg-background shadow-neu-inset px-3 py-1.5 rounded-xl">
                              {new Date(log.createdAt).toLocaleString()}
                           </span>
                        </td>
                        <td className="px-6 py-5 border-b border-primary/5 transition-all">
                           <div className="flex flex-col gap-1">
                              <span className={`text-xs font-black uppercase tracking-widest ${getActionColor(log.action)}`}>
                                 {log.action}
                              </span>
                              <span className="text-[11px] font-bold text-slate-400 line-clamp-1 max-w-[200px]">{log.description}</span>
                           </div>
                        </td>
                        <td className="px-6 py-5 border-b border-primary/5 transition-all">
                           <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-sm text-foreground">{log.module}</span>
                              {log.entityType && <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{log.entityType}</span>}
                           </div>
                        </td>
                        <td className="px-6 py-5 border-b border-primary/5 transition-all">
                           <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-sm text-foreground">{log.userName || 'SYSTEM'}</span>
                              {log.userRole && <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{log.userRole}</span>}
                           </div>
                        </td>
                        <td className="px-6 py-5 border-b border-primary/5 transition-all">
                           <div className="flex items-center gap-2">
                              {log.status === 'SUCCESS' ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}
                              <span className={`text-[10px] font-black uppercase tracking-widest ${log.status === 'SUCCESS' ? 'text-green-500' : 'text-red-500'}`}>
                                 {log.status || 'SUCCESS'}
                              </span>
                           </div>
                        </td>
                        <td className="px-6 py-5 border-b border-primary/5 transition-all">
                           <span className="font-mono text-xs text-slate-400 font-bold bg-background shadow-neu-inset px-2 py-1 rounded-lg">
                              {log.ipAddress || '127.0.0.1'}
                           </span>
                        </td>
                     </tr>
                     ))
                  )}
               </tbody>
               </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
               <div className="flex items-center justify-between pt-6 mt-2 border-t border-primary/5">
               <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Page {page} of {totalPages}
               </div>
               <div className="flex gap-3">
                  <button 
                     onClick={() => setPage(p => Math.max(1, p - 1))}
                     disabled={page === 1 || loading}
                     className="w-10 h-10 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl transition-all border-0 text-slate-500 hover:text-primary disabled:opacity-50 disabled:shadow-neu"
                  >
                     <ChevronLeft size={16} />
                  </button>
                  <button 
                     onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                     disabled={page === totalPages || loading}
                     className="w-10 h-10 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl transition-all border-0 text-slate-500 hover:text-primary disabled:opacity-50 disabled:shadow-neu"
                  >
                     <ChevronRight size={16} />
                  </button>
               </div>
               </div>
            )}
         </div>
      </div>

      {/* Log Details Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl bg-background border-0 shadow-2xl rounded-[2rem] p-8">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-background shadow-neu-inset rounded-2xl flex items-center justify-center text-primary shrink-0">
                  <ShieldAlert size={20} />
               </div>
               <div>
                  <DialogTitle className="text-xl font-black text-foreground">Audit Log Details</DialogTitle>
                  <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">Detailed view of the security event</DialogDescription>
               </div>
            </div>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background shadow-neu-inset rounded-2xl p-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Timestamp</h4>
                  <p className="font-mono text-sm font-bold">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                </div>
                <div className="bg-background shadow-neu-inset rounded-2xl p-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Status</h4>
                  <span className={`text-xs font-black uppercase tracking-widest ${selectedLog.status === 'SUCCESS' ? 'text-green-500' : 'text-red-500'}`}>
                    {selectedLog.status || 'SUCCESS'}
                  </span>
                </div>
                <div className="bg-background shadow-neu-inset rounded-2xl p-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Action</h4>
                  <span className={`text-xs font-black uppercase tracking-widest ${getActionColor(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                </div>
                <div className="bg-background shadow-neu-inset rounded-2xl p-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Module</h4>
                  <p className="font-bold text-sm mt-1">{selectedLog.module}</p>
                </div>
                <div className="bg-background shadow-neu-inset rounded-2xl p-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">User</h4>
                  <p className="font-bold text-sm">{selectedLog.userName || 'SYSTEM'}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{selectedLog.userRole}</p>
                </div>
                <div className="bg-background shadow-neu-inset rounded-2xl p-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Network (IP)</h4>
                  <p className="font-mono text-sm font-bold mt-1">{selectedLog.ipAddress}</p>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-2">Description</h4>
                <div className="bg-background shadow-neu-inset rounded-2xl p-4 text-sm font-bold text-foreground">
                  {selectedLog.description}
                </div>
              </div>

              {selectedLog.entityType && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background shadow-neu-inset rounded-2xl p-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Entity Type</h4>
                    <p className="text-sm font-bold mt-1">{selectedLog.entityType}</p>
                  </div>
                  <div className="bg-background shadow-neu-inset rounded-2xl p-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Entity ID</h4>
                    <p className="text-xs font-mono font-bold mt-1 truncate">{selectedLog.entityId}</p>
                  </div>
                </div>
              )}

              {(selectedLog.oldData || selectedLog.newData) && (
                <div className="space-y-4 pt-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-2">Data Changes</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedLog.oldData && (
                      <div className="bg-background shadow-neu-inset rounded-2xl p-4">
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-2">Old Data</h5>
                        <pre className="text-[10px] font-mono text-slate-500 overflow-x-auto custom-scrollbar">
                          {JSON.stringify(selectedLog.oldData, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedLog.newData && (
                      <div className="bg-background shadow-neu-inset rounded-2xl p-4">
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-green-400 mb-2">New Data</h5>
                        <pre className="text-[10px] font-mono text-slate-500 overflow-x-auto custom-scrollbar">
                          {JSON.stringify(selectedLog.newData, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
