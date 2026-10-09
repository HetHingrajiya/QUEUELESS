"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, XCircle, Calendar, 
  Building2, ArrowRight 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { EmptyState } from '@/components/common/EmptyState';
import { CitizenToken, ApiResponse } from '@/types/citizen';

export default function CancelledTokensHistoryPage() {
  const [cancelledList, setCancelledList] = useState<CitizenToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCancelled = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/citizen/token-history?status=CANCELLED');
        const json: ApiResponse<CitizenToken[]> = await res.json();
        if (json.success) {
          setCancelledList(json.data || []);
        } else {
          setError(json.message || 'Failed to load cancelled tokens');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchCancelled();
  }, []);

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Link href="/citizen/token-history" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
<h1 className="text-xl font-bold text-slate-900 mt-0.5">Cancelled Tokens</h1>
          </div>
        </div>
        <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full">
          {cancelledList.length} Records
        </span>
      </div>

      {loading ? (
        <SkeletonLoader type="history" count={3} />
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          {error}
        </div>
      ) : cancelledList.length === 0 ? (
        <EmptyState
          icon={<XCircle size={32} className="text-slate-400" />}
          title="No Cancelled Tokens"
          description="You don't have any cancelled tokens on record."
          actionText="Get a Token"
          actionHref="/citizen/offices"
        />
      ) : (
        <div className="space-y-3">
          {cancelledList.map((item) => (
            <Card key={item._id} className="border-slate-200 bg-white">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                      <XCircle size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{item.serviceName}</h3>
                      <p className="text-xs text-slate-500 flex items-center mt-0.5">
                        <Building2 size={12} className="mr-1 text-slate-400" />
                        {item.officeName}
                      </p>
                    </div>
                  </div>
                  <span className="font-black text-slate-400 text-base line-through">{item.tokenNumber}</span>
                </div>

                <div className="bg-slate-50 rounded-lg p-2.5 my-2 border border-slate-100 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Reason:</span> {item.notes || 'Cancelled by citizen'}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center">
                    <Calendar size={13} className="mr-1 text-slate-400" />
                    {new Date(item.date || item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <Link href="/citizen/offices">
                    <span className="text-blue-600 font-bold hover:underline flex items-center">
                      Re-Book <ArrowRight size={13} className="ml-1" />
                    </span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
