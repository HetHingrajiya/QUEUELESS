"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Search, Filter, Loader2, Edit, Trash2, 
  ChevronLeft, ChevronRight, Ticket, RefreshCw,
  Building2, Briefcase, Calendar, CheckCircle2, Clock, XCircle
} from 'lucide-react';
import Link from 'next/link';

interface TokenItem {
  id: string;
  tokenNumber: string;
  service: string;
  office: string;
  status: string;
  createdAt: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminTokensListPage() {
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const limit = 10;
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });

  const fetchTokens = useCallback(async (currentPage: number, searchTerm: string, currentStatus: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      if (currentStatus && currentStatus !== 'ALL') {
        params.append('status', currentStatus);
      }

      const res = await fetch(`/api/admin/tokens?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setTokens(json.data || []);
        if (json.pagination) {
          setPagination(json.pagination);
        } else {
          setPagination({
            total: (json.data || []).length,
            page: currentPage,
            limit,
            totalPages: Math.max(1, Math.ceil((json.data || []).length / limit))
          });
        }
      }
    } catch (err) {
      console.error('Failed to load tokens:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTokens(page, search, statusFilter);
    }, 250);
    return () => clearTimeout(timer);
  }, [page, search, statusFilter, fetchTokens]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to page 1 on new search
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setPage(1); // Reset to page 1 on new filter
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (page < pagination.totalPages) {
      setPage(prev => prev + 1);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this token?')) return;
    
    try {
      const res = await fetch(`/api/admin/tokens/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        fetchTokens(page, search, statusFilter);
      } else {
        alert(json.message || 'Failed to delete token');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while deleting token');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">Completed</Badge>;
      case 'SERVING':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Serving</Badge>;
      case 'CALLED':
        return <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-indigo-200">Called</Badge>;
      case 'CHECKED_IN':
        return <Badge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-100 border-cyan-200">Checked In</Badge>;
      case 'WAITING':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">Waiting</Badge>;
      case 'NO_SHOW':
      case 'SKIPPED':
        return <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 border-rose-200">No Show</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const startRecord = pagination.total === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, pagination.total);

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tokens Management</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {pagination.total} Total
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Browse, inspect, filter, and manage all organization token tickets.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fetchTokens(page, search, statusFilter)}
            disabled={loading}
            className="text-slate-600 hover:text-slate-900 border-slate-200"
          >
            <RefreshCw size={14} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/admin/tokens/add">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-2xs">
              <Plus size={16} className="mr-1.5" /> Issue Token
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border-slate-200 shadow-xs bg-white overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by token number (e.g. A-001)..." 
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
            />
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {['ALL', 'WAITING', 'SERVING', 'COMPLETED', 'NO_SHOW', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => handleStatusChange(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {st === 'ALL' ? 'All Statuses' : st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Tokens Table */}
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500">
              <Loader2 className="animate-spin h-8 w-8 text-blue-600 mb-2" />
              <p className="text-xs font-medium">Loading tokens...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Token Number</th>
                    <th className="px-6 py-3.5">Service</th>
                    <th className="px-6 py-3.5">Office</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Date & Time</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tokens.length > 0 ? (
                    tokens.map((token) => (
                      <tr key={token.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <Ticket size={16} className="text-blue-600" />
                            <span>{token.tokenNumber}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <Briefcase size={14} className="text-slate-400" />
                            <span>{token.service}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Building2 size={14} className="text-slate-400" />
                            <span>{token.office}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(token.status)}
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-slate-400" />
                            <span>
                              {new Date(token.createdAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span>
                              {new Date(token.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-1.5">
                            <Link href={`/admin/tokens/${token.id}/edit`}>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 w-8 p-0 border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50" 
                                title="Edit Token"
                              >
                                <Edit size={14} />
                              </Button>
                            </Link>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDelete(token.id)} 
                              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 border-red-200" 
                              title="Delete Token"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                          <Ticket className="h-10 w-10 text-slate-300 mb-2" />
                          <p className="font-semibold text-slate-700">No Tokens Found</p>
                          <p className="text-xs text-slate-400 mt-1 max-w-sm">
                            {search || statusFilter !== 'ALL' 
                              ? 'No tokens match your current filter or search criteria.' 
                              : 'No queue tokens have been generated yet.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls Footer */}
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
            <div className="text-xs text-slate-500">
              {pagination.total > 0 ? (
                <span>
                  Showing <strong className="text-slate-700">{startRecord}</strong> to <strong className="text-slate-700">{endRecord}</strong> of <strong className="text-slate-700">{pagination.total}</strong> records
                </span>
              ) : (
                <span>0 records found</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={page <= 1 || loading}
                className="h-8 px-3 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={15} className="mr-1" />
                Back
              </Button>

              <div className="flex items-center px-2 text-xs font-bold text-slate-600">
                Page {page} of {pagination.totalPages || 1}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={page >= pagination.totalPages || loading}
                className="h-8 px-3 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
                <ChevronRight size={15} className="ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
