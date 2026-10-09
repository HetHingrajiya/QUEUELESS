"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star, Building2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { CitizenFeedback, ApiResponse } from '@/types/citizen';

export default function FeedbackHistoryPage() {
  const [history, setHistory] = useState<CitizenFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/citizen/feedback');
        if (!res.ok) throw new Error(`Unable to load feedback (${res.status})`);
        const json: ApiResponse<CitizenFeedback[]> = await res.json();
        if (json.success) {
          setHistory(json.data || []);
        } else {
          setError(json.message || 'Failed to load feedback');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [retryCount]);

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Link href="/citizen/feedback" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
<h1 className="text-xl font-bold text-slate-900 mt-0.5">Feedback History</h1>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading feedback history..." />
      ) : error ? (
        <ErrorState description={error} onRetry={() => setRetryCount((count) => count + 1)} />
      ) : history.length === 0 ? (
        <EmptyState
          icon={<Star size={32} className="text-amber-400" />}
          title="No Feedback Submitted"
          description="You haven't submitted any service ratings or feedback reviews yet."
          actionText="Give Feedback"
          actionHref="/citizen/feedback"
        />
      ) : (
        <div className="space-y-4">
          {history.map((item) => {
            const serviceTitle = typeof item.serviceId === 'object' && item.serviceId !== null ? item.serviceId.name : item.serviceName;
            const officeTitle = typeof item.officeId === 'object' && item.officeId !== null ? item.officeId.name : (item.officeName || 'Office');
            const tokenTitle = typeof item.tokenId === 'object' && item.tokenId !== null && 'tokenNumber' in item.tokenId 
              ? `Token ${(item.tokenId as { tokenNumber: string }).tokenNumber}` 
              : 'General Visit';

            return (
              <Card key={item._id} className="border-slate-200 shadow-sm overflow-hidden bg-white">
                <CardContent className="p-5 space-y-3 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {serviceTitle || tokenTitle}
                      </h3>
                      <p className="text-[11px] text-slate-500 flex items-center mt-0.5">
                        <Building2 size={12} className="mr-1 text-slate-400" />
                        {officeTitle}
                      </p>
                    </div>
                  <div className="flex text-amber-400">
                    {[...Array(item.rating || 5)].map((_, i) => (
                      <Star key={i} size={14} className="fill-amber-400" />
                    ))}
                  </div>
                </div>

                {/* Citizen remarks */}
                {item.comment && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Your Submission</p>
                    <p className="text-slate-700 italic leading-relaxed">&ldquo;{item.comment}&rdquo;</p>
                  </div>
                )}

                {/* Office Response */}
                {item.officeResponse && (
                  <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-blue-700 uppercase font-bold flex items-center">
                        <CheckCircle2 size={12} className="mr-1 text-blue-600" />
                        Official Office Response
                      </span>
                      <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-2 py-0.5 rounded">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-slate-800 text-[11px] leading-relaxed">{item.officeResponse}</p>
                  </div>
                )}

                <div className="pt-1 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="text-emerald-600 font-semibold flex items-center">
                    <CheckCircle2 size={12} className="mr-1" /> Verified
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
        </div>
      )}
    </div>
  );
}
