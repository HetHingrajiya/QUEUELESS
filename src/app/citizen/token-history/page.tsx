"use client";

import { useState, useEffect } from 'react';
import { Calendar, Clock, Building2, Ticket, CheckCircle2, XCircle, ArrowRight, History, Activity } from 'lucide-react';
import Link from 'next/link';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { CitizenToken, ApiResponse } from '@/types/citizen';

export default function CitizenTokenHistoryPage() {
  const [history, setHistory] = useState<CitizenToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const query = activeTab === 'ALL' ? '' : `?status=${activeTab}`;
        const res = await fetch(`/api/citizen/token-history${query}`);
        if (!res.ok) throw new Error(`Unable to load token history (${res.status})`);
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
  }, [activeTab, retryCount]);

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'COMPLETED': return <CheckCircle2 size={14} className="text-emerald-500 mr-2" />;
      case 'NO_SHOW':
      case 'SKIPPED':
      case 'CANCELLED': return <XCircle size={14} className="text-red-500 mr-2" />;
      default: return <Clock size={14} className="text-primary mr-2" />;
    }
  };

  const tabs = [
    { id: 'ALL', label: 'All Visits' },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'CANCELLED', label: 'Cancelled' },
    { id: 'NO_SHOW', label: 'No Show' }
  ] as const;

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto pt-4 px-4 sm:px-6 lg:px-8 cursor-default">
      
      {/* Header section */}
      <div className="flex flex-col space-y-2 mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Token History</h1>
        <p className="text-muted-foreground text-xs sm:text-sm font-semibold">Chronological record of all government visits, tokens and service audits.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Column: Filters and Navigation */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Status Filters */}
          <div className="bg-background shadow-neu rounded-[2rem] p-6 border-0">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-6 flex items-center">
              <Activity size={16} className="text-primary mr-2" /> Filter by Status
            </h3>
            
            <div className="flex flex-col space-y-3">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-between ${
                    activeTab === tab.id
                      ? 'bg-background shadow-neu-inset text-primary border-2 border-primary/10'
                      : 'bg-background shadow-neu text-muted-foreground hover:shadow-neu-hover hover:text-foreground'
                  }`}
                >
                  <span>{tab.label}</span>
                  {activeTab === tab.id && <span className="w-2 h-2 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Category Links */}
          <div className="bg-background shadow-neu rounded-[2rem] p-6 border-0">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-6 flex items-center">
              <History size={16} className="text-primary mr-2" /> Dedicated Hubs
            </h3>
            
            <div className="space-y-4">
              <Link href="/citizen/history/completed" className="block">
                <div className="w-full px-5 py-4 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl transition-all flex items-center group">
                  <div className="w-8 h-8 rounded-full bg-background shadow-neu-inset flex items-center justify-center mr-3 group-hover:text-emerald-500 transition-colors">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  </div>
                  <span className="text-xs font-black text-foreground uppercase tracking-wider">Completed Hub</span>
                </div>
              </Link>
              <Link href="/citizen/history/cancelled" className="block">
                <div className="w-full px-5 py-4 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl transition-all flex items-center group">
                  <div className="w-8 h-8 rounded-full bg-background shadow-neu-inset flex items-center justify-center mr-3 group-hover:text-red-500 transition-colors">
                    <XCircle size={14} className="text-red-500" />
                  </div>
                  <span className="text-xs font-black text-foreground uppercase tracking-wider">Cancelled Hub</span>
                </div>
              </Link>
            </div>
          </div>

        </div>

        {/* Right Column: History List */}
        <div className="lg:col-span-8">
          {loading ? (
            <LoadingState label="Loading token history..." />
          ) : error ? (
            <ErrorState description={error} onRetry={() => setRetryCount((count) => count + 1)} />
          ) : history.length === 0 ? (
            <div className="bg-background shadow-neu rounded-[2rem] p-8 border-0">
              <EmptyState
                icon={<Ticket size={48} className="text-primary/50" />}
                title={`No ${activeTab === 'ALL' ? '' : activeTab.toLowerCase()} tokens`}
                description={activeTab === 'ALL' ? "You don't have any past queue tokens on record." : `No tokens with status "${activeTab}".`}
                actionText="Get a Token"
                actionHref="/citizen/offices"
              />
            </div>
          ) : (
            <div className="space-y-5">
              {history.map((token) => (
                <Link key={token._id} href={`/citizen/token-history/${token._id}`} className="block group">
                  <div className="bg-background shadow-neu group-hover:shadow-neu-hover rounded-3xl p-6 border-0 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    
                    {/* Left: Token ID & Details */}
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-background shadow-neu-inset flex items-center justify-center text-primary font-black text-xl shrink-0">
                        {token.tokenNumber.split('-')[0] || 'T'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-base sm:text-lg text-foreground truncate mb-1">{token.serviceName}</h3>
                        <p className="text-xs font-semibold text-muted-foreground flex items-center truncate">
                          <Building2 size={14} className="mr-2 shrink-0 text-primary" />
                          <span className="truncate">{token.officeName}</span>
                        </p>
                      </div>
                    </div>

                    {/* Right: Date, Status, Number */}
                    <div className="flex flex-col sm:items-end justify-between gap-3 shrink-0 sm:min-w-[180px]">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Token Number</p>
                        <p className="text-2xl font-black text-foreground tracking-tight">{token.tokenNumber}</p>
                      </div>
                      
                      <div className="flex items-center gap-4 bg-background shadow-neu-inset px-4 py-2 rounded-xl border-0">
                        <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          <Calendar size={12} className="mr-2 text-primary" />
                          {new Date(token.date || token.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="w-px h-4 bg-muted-foreground/20"></div>
                        <div className="flex items-center">
                          {getStatusIcon(token.status)}
                          <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{token.status}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
