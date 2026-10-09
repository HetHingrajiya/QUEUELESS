"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, Building2, Ticket, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { EmptyState } from '@/components/common/EmptyState';
import { CitizenToken, ApiResponse } from '@/types/citizen';

export default function CitizenTokenHistoryPage() {
  const [history, setHistory] = useState<CitizenToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'>('ALL');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const query = activeTab === 'ALL' ? '' : `?status=${activeTab}`;
        const res = await fetch(`/api/citizen/token-history${query}`);
        const json: ApiResponse<CitizenToken[]> = await res.json();
        if (json.success) {
          setHistory(json.data || []);
        } else {
          setError(json.message || 'Failed to load history');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Network error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [activeTab]);

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'COMPLETED': return <CheckCircle2 size={14} className="text-emerald-500 mr-1" />;
      case 'NO_SHOW':
      case 'CANCELLED': return <XCircle size={14} className="text-red-500 mr-1" />;
      default: return <Clock size={14} className="text-blue-500 mr-1" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'NO_SHOW':
      case 'CANCELLED': return 'bg-red-50 text-red-700 border-red-200';
      case 'WAITING':
      case 'CHECKED_IN': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CALLED':
      case 'SERVING': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto pt-2">
      <div className="flex flex-col space-y-1">
<h1 className="text-2xl font-extrabold text-slate-900">Token History</h1>
        <p className="text-slate-500 text-sm">Chronological record of all government visits, tokens and service audits.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        {(['ALL', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === tab
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab === 'ALL' ? 'All Visits' : tab === 'NO_SHOW' ? 'No Show' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Dedicated Category Views */}
      <div className="flex items-center gap-2 text-xs">
        <Link 
          href="/citizen/history/completed" 
          className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-semibold hover:bg-emerald-100 transition-colors inline-flex items-center"
        >
          <CheckCircle2 size={13} className="mr-1" /> Completed Services Hub
        </Link>
        <Link 
          href="/citizen/history/cancelled" 
          className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg font-semibold hover:bg-red-100 transition-colors inline-flex items-center"
        >
          <XCircle size={13} className="mr-1" /> Cancelled & No-Show Logs
        </Link>
      </div>

      {loading ? (
        <SkeletonLoader type="history" count={4} />
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          {error}
        </div>
      ) : history.length === 0 ? (
        <EmptyState
          icon={<Ticket size={32} />}
          title={`No ${activeTab === 'ALL' ? '' : activeTab.toLowerCase()} tokens`}
          description={activeTab === 'ALL' ? "You don't have any past queue tokens on record." : `No tokens with status "${activeTab}".`}
          actionText="Get a Token"
          actionHref="/citizen/offices"
        />
      ) : (
        <div className="space-y-3">
          {history.map((token) => (
            <Link key={token._id} href={`/citizen/token-history/${token._id}`} className="block transition-transform hover:-translate-y-0.5">
              <Card className="hover:shadow-md transition-all border-slate-200 bg-white">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-black text-sm shrink-0">
                        {token.tokenNumber.split('-')[0] || 'T'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-slate-900 truncate">{token.serviceName}</h3>
                        <p className="text-xs text-slate-400 flex items-center mt-0.5 truncate">
                          <Building2 size={12} className="mr-1 shrink-0" />
                          <span>{token.officeName}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-black text-slate-900 tracking-tight">{token.tokenNumber}</p>
                    </div>
                  </div>
                  
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center text-[11px] text-slate-400">
                      <Calendar size={12} className="mr-1" />
                      {new Date(token.date || token.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center ${getStatusColor(token.status)}`}>
                        {getStatusIcon(token.status)}
                        {token.status}
                      </span>
                      <ArrowRight size={13} className="text-slate-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
