"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Filter, Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
    if (act.includes('CREATE')) return 'bg-blue-50 text-blue-700';
    if (act.includes('UPDATE')) return 'bg-amber-50 text-amber-700';
    if (act.includes('DELETE') || act.includes('FAILED')) return 'bg-red-50 text-red-700';
    if (act.includes('LOGIN')) return 'bg-green-50 text-green-700';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Audit Logs</h2>
          <p className="text-sm text-slate-500">Track all system activities and security events.</p>
        </div>
        <Button onClick={fetchLogs} variant="outline" size="sm">Refresh</Button>
      </div>

      <Card>
        <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <Input 
                placeholder="Search logs..." 
                className="pl-9 bg-white"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex space-x-2">
              <div className="flex items-center space-x-2 bg-white border rounded-md px-3 py-1">
                <Calendar size={16} className="text-slate-500" />
                <input 
                  type="date" 
                  className="text-sm border-none focus:ring-0 outline-none w-32"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                />
                <span className="text-slate-400">-</span>
                <input 
                  type="date" 
                  className="text-sm border-none focus:ring-0 outline-none w-32"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                />
              </div>
              <Button 
                variant={showFilters ? "default" : "outline"} 
                className={!showFilters ? "bg-white" : ""}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={16} className="mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t flex flex-wrap gap-4">
              <div className="w-48">
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Action</label>
                <Select value={action} onValueChange={(v: any) => { setAction(v); setPage(1); }}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="All Actions" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Actions</SelectItem>
                    <SelectItem value="LOGIN">LOGIN</SelectItem>
                    <SelectItem value="LOGIN_FAILED">LOGIN_FAILED</SelectItem>
                    <SelectItem value="CREATE">CREATE</SelectItem>
                    <SelectItem value="UPDATE">UPDATE</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Module</label>
                <Select value={moduleFilter} onValueChange={(v: any) => { setModuleFilter(v); setPage(1); }}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="All Modules" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Modules</SelectItem>
                    <SelectItem value="Authentication">Authentication</SelectItem>
                    <SelectItem value="Organizations">Organizations</SelectItem>
                    <SelectItem value="Offices">Offices</SelectItem>
                    <SelectItem value="Users">Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Role</label>
                <Select value={role} onValueChange={(v: any) => { setRole(v); setPage(1); }}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="All Roles" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Roles</SelectItem>
                    <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                    <SelectItem value="STAFF">STAFF</SelectItem>
                    <SelectItem value="CITIZEN">CITIZEN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Status</label>
                <Select value={statusFilter} onValueChange={(v: any) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="SUCCESS">SUCCESS</SelectItem>
                    <SelectItem value="FAILED">FAILED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="ghost" onClick={() => { setAction(''); setModuleFilter(''); setRole(''); setStatusFilter(''); setStartDate(''); setEndDate(''); setPage(1); }} className="text-slate-500">
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4">Timestamp</th>
                  <th scope="col" className="px-6 py-4">Action</th>
                  <th scope="col" className="px-6 py-4">Module</th>
                  <th scope="col" className="px-6 py-4">User</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {loading && logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">Loading audit logs...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">No audit logs found.</td>
                  </tr>
                ) : (
                  logs.map((log: any) => (
                    <tr 
                      key={log._id} 
                      className="bg-white border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{log.description}</p>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {log.module}
                        {log.entityType && <span className="block text-xs text-slate-400 font-normal">{log.entityType}</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-700">{log.userName || 'SYSTEM'}</div>
                        {log.userRole && <div className="text-xs text-slate-400">{log.userRole}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${log.status === 'SUCCESS' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {log.status || 'SUCCESS'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
              <div className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Details Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase">Timestamp</h4>
                  <p className="font-mono text-sm">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase">Status</h4>
                  <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${selectedLog.status === 'SUCCESS' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {selectedLog.status || 'SUCCESS'}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase">Action</h4>
                  <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${getActionColor(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase">Module</h4>
                  <p className="font-medium mt-1">{selectedLog.module}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase">User</h4>
                  <p className="font-medium mt-1">{selectedLog.userName || 'SYSTEM'}</p>
                  <p className="text-xs text-slate-500">{selectedLog.userRole}</p>
                  <p className="text-xs font-mono text-slate-400">{selectedLog.userId}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase">Network</h4>
                  <p className="font-mono text-sm mt-1">{selectedLog.ipAddress}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Description</h4>
                <div className="bg-slate-50 p-3 rounded border text-sm text-slate-700">
                  {selectedLog.description}
                </div>
              </div>

              {selectedLog.entityType && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase">Entity Type</h4>
                    <p className="text-sm mt-1">{selectedLog.entityType}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase">Entity ID</h4>
                    <p className="text-sm font-mono mt-1">{selectedLog.entityId}</p>
                  </div>
                </div>
              )}

              {(selectedLog.oldData || selectedLog.newData) && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase border-b pb-2">Data Changes</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedLog.oldData && (
                      <div>
                        <h5 className="text-xs font-semibold text-slate-500 mb-2">Old Data</h5>
                        <pre className="bg-red-50 text-red-900 p-3 rounded text-xs overflow-x-auto border border-red-100">
                          {JSON.stringify(selectedLog.oldData, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedLog.newData && (
                      <div>
                        <h5 className="text-xs font-semibold text-slate-500 mb-2">New Data</h5>
                        <pre className="bg-green-50 text-green-900 p-3 rounded text-xs overflow-x-auto border border-green-100">
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
