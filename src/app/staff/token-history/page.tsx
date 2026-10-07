"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Eye } from 'lucide-react';
import Link from 'next/link';

export interface TokenHistoryRecord {
  _id: string;
  tokenNumber: string;
  citizenName: string;
  serviceName: string;
  status: string;
  createdAt: string;
  callTime?: string;
  endTime?: string;
  processingTime?: number;
}

export default function StaffTokenHistoryPage() {
  const [tokens, setTokens] = useState<TokenHistoryRecord[]>([]);
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
        setTokens(json.data);
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

  const formatTimeOnly = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Token History</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tokens</CardTitle>
          <CardDescription>Comprehensive history of tokens assigned to your services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <form onSubmit={handleSearch} className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search token or citizen..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </form>
            <div className="flex space-x-2">
              <select 
                value={statusFilter}
                onChange={handleStatusChange}
                className="border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="WAITING">Waiting</option>
                <option value="CHECKED_IN">Checked In</option>
                <option value="CALLED">Called</option>
                <option value="SERVING">Serving</option>
                <option value="COMPLETED">Completed</option>
                <option value="NO_SHOW">No Show</option>
                <option value="SKIPPED">Skipped</option>
              </select>
            </div>
          </div>
          
          <div className="border border-slate-200 rounded-md overflow-x-auto mb-4">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Token</th>
                  <th className="px-4 py-3 font-medium">Citizen</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Called</th>
                  <th className="px-4 py-3 font-medium">Completed</th>
                  <th className="px-4 py-3 font-medium">Processing Time</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading token history...
                    </td>
                  </tr>
                ) : tokens.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                      No tokens found.
                    </td>
                  </tr>
                ) : (
                  tokens.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50 transition-colors text-slate-600">
                      <td className="px-4 py-3 font-bold text-slate-900">{item.tokenNumber}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{item.citizenName}</td>
                      <td className="px-4 py-3 truncate max-w-[150px]">{item.serviceName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          item.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                          item.status === 'SERVING' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                          item.status === 'CALLED' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                          item.status === 'WAITING' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          item.status === 'NO_SHOW' ? 'bg-red-100 text-red-700 border-red-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">{formatTimeOnly(item.createdAt)}</td>
                      <td className="px-4 py-3">{formatTimeOnly(item.callTime)}</td>
                      <td className="px-4 py-3">{formatTimeOnly(item.endTime)}</td>
                      <td className="px-4 py-3">
                        {item.processingTime ? `${Math.floor(item.processingTime / 60)}m ${item.processingTime % 60}s` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/staff/queue/${item._id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600">
                            <Eye size={16} />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && pagination.pages > 1 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
              </span>
              <div className="flex space-x-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={pagination.page === pagination.pages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
