"use client";

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, Clock, Building2, User, 
  CheckCircle2, Ticket, Star, FileText, MapPin 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { CitizenTokenHistoryDetail, ApiResponse } from '@/types/citizen';

export default function TokenHistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<CitizenTokenHistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/citizen/token-history/${id}`);
        const json: ApiResponse<CitizenTokenHistoryDetail> = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        } else {
          setError(json.message || 'Token record not found');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto pt-4">
        <SkeletonLoader type="history" count={3} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto pt-8 text-center space-y-3">
        <p className="text-red-600 font-medium">{error || 'Token record not found'}</p>
        <Link href="/citizen/token-history">
          <Button variant="outline" size="sm">Back to History</Button>
        </Link>
      </div>
    );
  }

  const { token, office, service, counter, timeline, feedback } = data;

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <button 
            onClick={() => router.back()} 
            className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Screen 33 • History
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">Visit Details</h1>
          </div>
        </div>
      </div>

      {/* Main Ticket Summary Card */}
      <Card className="border-slate-200 overflow-hidden shadow-sm bg-white">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200">HISTORICAL TOKEN</p>
              <h2 className="text-4xl font-black mt-0.5">{token.tokenNumber}</h2>
              <p className="text-xs text-blue-100 mt-1 font-medium">{service?.name || 'Data unavailable'}</p>
            </div>
            <span className="bg-white/20 text-white border border-white/30 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase">
              {token.status}
            </span>
          </div>
        </div>

        <CardContent className="p-5 space-y-4 text-xs">
          <div className="space-y-2 pb-3 border-b border-slate-100">
            <div className="flex justify-between">
              <span className="text-slate-400">Office Branch:</span>
              <span className="font-bold text-slate-800 text-right">{office?.name || 'Data unavailable'}</span>
            </div>
            {office?.address && (
              <div className="flex justify-between">
                <span className="text-slate-400">Address:</span>
                <span className="text-slate-600 text-right max-w-[200px] truncate">{office.address}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Date of Visit:</span>
              <span className="font-medium text-slate-800">
                {new Date(token.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            {counter && (
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Counter:</span>
                <span className="font-medium text-slate-800">{counter.name || `Counter ${counter.counterNumber}`}</span>
              </div>
            )}
          </div>

          {/* Time Metrics */}
          <div className="grid grid-cols-2 gap-3 py-1">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Queue Wait</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">{token.waitMinutes ?? 0} mins</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Service Duration</p>
              <p className="text-base font-bold text-emerald-600 mt-0.5">{Number(token.serviceDuration) > 0 ? `${token.serviceDuration} mins` : 'Completed'}</p>
            </div>
          </div>

          {/* Timeline Events from MongoDB */}
          {timeline && timeline.length > 0 && (
            <div className="pt-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center">
                <Clock size={13} className="mr-1.5 text-blue-600" /> Complete Audit Timeline
              </h4>
              <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 pl-6">
                {timeline.map((event: { eventType: string; time: string | Date }, idx: number) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white" />
                    <p className="font-bold text-slate-800">{event.eventType.replace('_', ' ')}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(event.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submitted Feedback */}
          {feedback && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-amber-800 flex items-center gap-1">
                  <Star size={13} className="fill-amber-500 text-amber-500" /> Rated {feedback.rating}/5
                </span>
                <span className="text-[10px] text-amber-600">Verified</span>
              </div>
              {feedback.comment && (
                <p className="text-[11px] text-amber-900 italic">&ldquo;{feedback.comment}&rdquo;</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action CTA */}
      <div className="space-y-2">
        {!feedback && token.status === 'COMPLETED' && (
          <Link href={`/citizen/feedback/rating?tokenId=${token._id}&officeId=${office?._id}`} className="block w-full">
            <Button className="w-full h-11 bg-amber-500 hover:bg-amber-600 font-bold text-xs text-white">
              <Star size={14} className="mr-1.5" /> Rate This Service
            </Button>
          </Link>
        )}
        <Link href="/citizen/token-history" className="block w-full">
          <Button variant="ghost" className="w-full text-xs text-slate-500">
            Back to Token History
          </Button>
        </Link>
      </div>
    </div>
  );
}
