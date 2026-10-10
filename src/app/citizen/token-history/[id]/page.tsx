"use client";

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, Clock, Building2, User, 
  CheckCircle2, Ticket, Star, FileText, MapPin 
} from 'lucide-react';
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
      <div className="max-w-6xl mx-auto pt-4 px-4 sm:px-6 lg:px-8">
        <SkeletonLoader type="history" count={3} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto pt-16 text-center space-y-6">
        <div className="w-24 h-24 rounded-3xl bg-background shadow-neu-inset flex items-center justify-center mx-auto text-muted-foreground">
          <Ticket size={40} />
        </div>
        <p className="text-foreground font-black text-lg">{error || 'Token record not found'}</p>
        <Link href="/citizen/token-history">
          <button className="px-6 py-3 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset text-primary font-black rounded-xl transition-all uppercase tracking-widest text-xs">
            Back to History
          </button>
        </Link>
      </div>
    );
  }

  const { token, office, service, counter, timeline, feedback } = data;

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto pt-4 px-4 sm:px-6 lg:px-8 cursor-default">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button 
            onClick={() => router.back()} 
            className="w-12 h-12 mr-4 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-full transition-all text-muted-foreground hover:text-foreground shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Visit Details</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Column: Historical Token Pass */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-10 text-center border-0 relative overflow-hidden transition-all hover:shadow-neu-hover">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Historical Record</p>
            
            <div className="w-full max-w-[240px] mx-auto bg-background shadow-neu-inset rounded-[2rem] py-8 my-8">
               <p className="text-7xl font-black text-foreground opacity-60 tracking-tighter drop-shadow-sm">{token.tokenNumber}</p>
            </div>
            
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-background shadow-neu-inset text-foreground mb-6">
              <span className={`w-2.5 h-2.5 rounded-full ${token.status === 'COMPLETED' ? 'bg-emerald-500' : token.status === 'CANCELLED' ? 'bg-red-500' : 'bg-muted-foreground'}`} />
              {token.status}
            </div>

            <p className="text-lg font-black text-foreground leading-snug mb-2">{service?.name || 'Data unavailable'}</p>
            <p className="text-sm font-semibold text-muted-foreground">{office?.name || 'Data unavailable'}</p>
          </div>

          {!feedback && token.status === 'COMPLETED' && (
            <Link href={`/citizen/feedback/rating?tokenId=${token._id}&officeId=${office?._id}`} className="block w-full">
              <button className="w-full h-16 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset text-amber-500 font-black text-sm uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3">
                <Star size={18} /> Rate This Service
              </button>
            </Link>
          )}
        </div>

        {/* Right Column: Detailed Audit & Timeline */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Metadata Grid */}
          <div className="space-y-4 text-sm text-left bg-background shadow-neu-inset p-8 rounded-3xl border-0">
            <div className="flex justify-between items-center border-b border-muted/10 pb-4">
              <span className="font-black text-muted-foreground uppercase tracking-widest text-xs flex items-center">
                <Building2 size={16} className="mr-3 text-primary" /> Branch
              </span>
              <span className="font-bold text-foreground text-right truncate max-w-[220px]">{office?.name || 'Data unavailable'}</span>
            </div>
            {office?.address && (
              <div className="flex justify-between items-center border-b border-muted/10 pb-4">
                <span className="font-black text-muted-foreground uppercase tracking-widest text-xs flex items-center">
                  <MapPin size={16} className="mr-3 text-primary" /> Address
                </span>
                <span className="font-bold text-foreground text-right truncate max-w-[220px]">{office.address}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-b border-muted/10 pb-4">
              <span className="font-black text-muted-foreground uppercase tracking-widest text-xs flex items-center">
                <Calendar size={16} className="mr-3 text-primary" /> Date of Visit
              </span>
              <span className="font-bold text-foreground">
                {new Date(token.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            {counter && (
              <div className="flex justify-between items-center">
                <span className="font-black text-muted-foreground uppercase tracking-widest text-xs flex items-center">
                  <User size={16} className="mr-3 text-primary" /> Assigned Counter
                </span>
                <span className="font-bold text-foreground bg-background shadow-neu px-4 py-2 rounded-xl">{counter.name || `Counter ${counter.counterNumber}`}</span>
              </div>
            )}
          </div>

          {/* Time Metrics Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-background shadow-neu rounded-[2rem] p-6 text-center">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Queue Wait</p>
              <div className="font-black text-3xl text-foreground flex items-baseline justify-center gap-1">
                {token.waitMinutes ?? 0}
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">MIN</span>
              </div>
            </div>
            <div className="bg-background shadow-neu rounded-[2rem] p-6 text-center">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Service Duration</p>
              <div className="font-black text-3xl text-primary flex items-baseline justify-center gap-1">
                {Number(token.serviceDuration) > 0 ? token.serviceDuration : '0'}
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">MIN</span>
              </div>
            </div>
          </div>

          {/* Submitted Feedback */}
          {feedback && (
            <div className="p-6 bg-background shadow-neu-inset rounded-[2rem] border-2 border-amber-500/20">
              <div className="flex items-center justify-between mb-4">
                <span className="font-black text-amber-500 flex items-center gap-2 text-sm uppercase tracking-widest">
                  <Star size={16} className="fill-amber-500" /> Rated {feedback.rating}/5
                </span>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-background shadow-neu px-3 py-1.5 rounded-full">Verified</span>
              </div>
              {feedback.comment && (
                <div className="bg-background shadow-neu p-5 rounded-2xl">
                  <p className="text-sm font-semibold text-foreground italic">&ldquo;{feedback.comment}&rdquo;</p>
                </div>
              )}
            </div>
          )}

          {/* Audit Timeline */}
          {timeline && timeline.length > 0 && (
            <div className="bg-background shadow-neu rounded-[2rem] p-8 border-0">
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-6 flex items-center">
                <Clock size={16} className="mr-3 text-primary" /> Complete Audit Timeline
              </h4>
              
              <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-background before:shadow-neu-inset ml-2">
                {timeline.map((event: { eventType: string; time: string | Date }, idx: number) => (
                  <div key={idx} className="relative pl-10">
                    <span className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-background shadow-neu flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                    </span>
                    <p className="font-bold text-foreground text-sm mb-1">{event.eventType.replace('_', ' ')}</p>
                    <p className="text-xs font-bold text-muted-foreground bg-background shadow-neu-inset px-3 py-1 rounded-lg inline-block">
                      {new Date(event.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
