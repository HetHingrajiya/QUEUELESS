"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, CheckCircle2, Calendar, Clock, 
  Building2, Ticket, Star, ArrowRight 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { CitizenToken, ApiResponse } from '@/types/citizen';

export default function CompletedServicesPage() {
  const [completedList, setCompletedList] = useState<CitizenToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchCompleted = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/citizen/token-history?status=COMPLETED');
        if (!res.ok) throw new Error(`Unable to load completed services (${res.status})`);
        const json: ApiResponse<CitizenToken[]> = await res.json();
        if (json.success) {
          setCompletedList(json.data || []);
        } else {
          setError(json.message || 'Failed to load completed services');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchCompleted();
  }, [retryCount]);

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Link href="/citizen/token-history" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
<h1 className="text-xl font-bold text-slate-900 mt-0.5">Completed Services</h1>
          </div>
        </div>
        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
          {completedList.length} Fulfilled
        </span>
      </div>

      {loading ? (
        <LoadingState label="Loading completed services..." />
      ) : error ? (
        <ErrorState description={error} onRetry={() => setRetryCount((count) => count + 1)} />
      ) : completedList.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 size={32} className="text-emerald-500" />}
          title="No Completed Services"
          description="You don't have any completed appointments or service visits yet."
          actionText="Get a Token"
          actionHref="/citizen/offices"
        />
      ) : (
        <div className="space-y-3">
          {completedList.map((item) => (
            <Link key={item._id} href={`/citizen/token-history/${item._id}`} className="block">
              <Card className="border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all bg-white">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{item.serviceName}</h3>
                        <p className="text-xs text-slate-500 flex items-center mt-0.5">
                          <Building2 size={12} className="mr-1 text-slate-400" />
                          {item.officeName}
                        </p>
                      </div>
                    </div>
                    <span className="font-black text-slate-900 text-base">{item.tokenNumber}</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center">
                        <Calendar size={13} className="mr-1 text-slate-400" />
                        {new Date(item.date || item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {Number(item.serviceDuration) > 0 && (
                        <span className="flex items-center text-emerald-700 font-medium">
                          <Clock size={13} className="mr-1" /> {item.serviceDuration}m
                        </span>
                      )}
                    </div>
                    <span className="text-blue-600 font-semibold flex items-center">
                      Details <ArrowRight size={13} className="ml-1" />
                    </span>
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
