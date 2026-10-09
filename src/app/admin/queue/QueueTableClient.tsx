"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Filter, Activity, ChevronLeft, ChevronRight, 
  Ticket, Building2, Briefcase, Calendar, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface SerializedTokenItem {
  id: string;
  tokenNumber: string;
  officeName: string;
  serviceName: string;
  counterName: string;
  status: string;
  createdAt: string;
}

interface QueueTableClientProps {
  initialTokens: SerializedTokenItem[];
  availableOffices: string[];
}

export function QueueTableClient({ initialTokens, availableOffices }: QueueTableClientProps) {
  const [search, setSearch] = useState('');
  const [selectedOffice, setSelectedOffice] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Filter tokens based on search & selected office
  const filteredTokens = useMemo(() => {
    return initialTokens.filter((token) => {
      const matchSearch = search.trim() === '' || 
        token.tokenNumber.toLowerCase().includes(search.toLowerCase()) ||
        token.serviceName.toLowerCase().includes(search.toLowerCase()) ||
        token.officeName.toLowerCase().includes(search.toLowerCase()) ||
        token.counterName.toLowerCase().includes(search.toLowerCase());

      const matchOffice = selectedOffice === 'ALL' || token.officeName === selectedOffice;

      return matchSearch && matchOffice;
    });
  }, [initialTokens, search, selectedOffice]);

  // Total pages
  const totalPages = Math.max(1, Math.ceil(filteredTokens.length / pageSize));

  // Current page records (10 records per page)
  const paginatedTokens = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTokens.slice(start, start + pageSize);
  }, [filteredTokens, page, pageSize]);

  const handlePrevPage = () => {
    if (page > 1) setPage(p => p - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(p => p + 1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold gap-1">
            <CheckCircle2 size={12} className="text-emerald-600" /> Completed
          </Badge>
        );
      case 'SERVING':
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-semibold gap-1">
            <Clock size={12} className="text-blue-600" /> Serving
          </Badge>
        );
      case 'CALLED':
        return (
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold gap-1">
            Called
          </Badge>
        );
      case 'WAITING':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-semibold gap-1">
            Waiting
          </Badge>
        );
      case 'NO_SHOW':
      case 'SKIPPED':
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-semibold gap-1">
            <XCircle size={12} className="text-rose-600" /> No Show
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-semibold gap-1">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const startRecord = filteredTokens.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, filteredTokens.length);

  return (
    <Card className="border-slate-200 shadow-xs bg-white overflow-hidden">
      {/* Header Controls */}
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
            <Input 
              placeholder="Search token number, service, counter..." 
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-white text-sm border-slate-200" 
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600">
              <Filter size={14} className="text-slate-400" />
              <span className="font-semibold text-slate-700">Office:</span>
              <select
                value={selectedOffice}
                onChange={(e) => {
                  setSelectedOffice(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Offices</option>
                {availableOffices.map((off) => (
                  <option key={off} value={off}>{off}</option>
                ))}
              </select>
            </div>

            <span className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              {filteredTokens.length} Tokens
            </span>
          </div>
        </div>
      </CardHeader>

      {/* Table */}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100 font-semibold">
              <tr>
                <th scope="col" className="px-6 py-3.5">Token Number</th>
                <th scope="col" className="px-6 py-3.5">Office</th>
                <th scope="col" className="px-6 py-3.5">Service</th>
                <th scope="col" className="px-6 py-3.5">Counter</th>
                <th scope="col" className="px-6 py-3.5">Status</th>
                <th scope="col" className="px-6 py-3.5">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTokens.length > 0 ? (
                paginatedTokens.map((token) => (
                  <tr key={token.id} className="bg-white hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <Ticket size={15} className="text-blue-600" />
                        <span>{token.tokenNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={13} className="text-slate-400" />
                        <span>{token.officeName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Briefcase size={13} className="text-slate-400" />
                        <span>{token.serviceName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">
                      {token.counterName}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(token.status)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400" />
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Activity className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No Tokens Found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {search || selectedOffice !== 'ALL'
                        ? 'No tokens match your current search or office filter.'
                        : 'There are no records in this queue list.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar (10 records per page with Back and Next) */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
          <div className="text-xs text-slate-500">
            {filteredTokens.length > 0 ? (
              <span>
                Showing <strong className="text-slate-700">{startRecord}</strong> to <strong className="text-slate-700">{endRecord}</strong> of <strong className="text-slate-700">{filteredTokens.length}</strong> records
              </span>
            ) : (
              <span>0 records</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={page <= 1}
              className="h-8 px-3 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft size={15} className="mr-1" />
              Back
            </Button>

            <div className="flex items-center px-2 text-xs font-bold text-slate-600">
              Page {page} of {totalPages}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={page >= totalPages}
              className="h-8 px-3 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Next
              <ChevronRight size={15} className="ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
