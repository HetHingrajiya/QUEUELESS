"use client";
import Link from 'next/link';
import { ArrowLeft, Clock, Users, Briefcase, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CitizenService, CitizenOffice, QueueMetrics, ApiResponse } from '@/types/citizen';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';

export default function ServiceDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [data, setData] = useState<{ service: CitizenService, office: CitizenOffice, stats: QueueMetrics } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        const res = await fetch(`/api/citizen/services/${id}`);
        if (!res.ok) throw new Error(`Unable to load service details (${res.status})`);
        const json: ApiResponse<{ service: CitizenService, office: CitizenOffice, stats: QueueMetrics }> = await res.json();
        
        if (json.success && json.data) {
          setData(json.data);
        } else {
          setError(json.message || 'Failed to load service details');
        }
      } catch (err: unknown) {
        setError('An error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchServiceDetails();
  }, [id, retryCount]);

  const handleTakeToken = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/citizen/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: data?.service?._id || id, officeId: data?.office?._id })
      });
      const json = await res.json();
      if (json.success) {
        router.push(`/citizen/queue/${json.data.tokenId}`);
      } else {
        alert(json.message || 'Failed to generate token');
        setGenerating(false);
      }
    } catch (err) {
      alert('An error occurred while generating your token.');
      setGenerating(false);
    }
  };

  if (loading) {
    return <LoadingState label="Loading service details..." className="py-16" />;
  }

  if (error || !data) {
    return (
      <div className="py-12 space-y-6 flex flex-col items-center">
        <ErrorState description={error || 'Service not found'} onRetry={() => setRetryCount((count) => count + 1)} />
        <button onClick={() => router.back()} className="px-6 py-3 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset text-primary font-bold rounded-xl transition-all">
          ← Go Back
        </button>
      </div>
    );
  }

  const { service, office, stats } = data;

  return (
    <div className="space-y-8 pb-32 pt-2 cursor-default">
      {/* Header */}
      <div className="flex items-center">
        <button onClick={() => router.back()} className="w-12 h-12 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-full transition-all text-muted-foreground hover:text-foreground shrink-0">
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* Main Title Area */}
      <div className="text-center mb-10 pt-4">
        <div className="w-24 h-24 rounded-3xl bg-background shadow-neu-inset text-primary flex items-center justify-center mx-auto mb-8 relative">
          <Briefcase size={40} className="relative z-10" />
          <div className="absolute inset-0 bg-primary/5 blur-xl rounded-full" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3 leading-tight tracking-tight px-4">{service.name}</h1>
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-background shadow-neu-inset text-muted-foreground font-semibold text-sm">
          <span>{office?.name || 'Unknown Office'}</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-5 sm:gap-8 mb-8">
        <div className="bg-background shadow-neu rounded-3xl p-6 sm:p-8 text-center border-0 transition-all hover:-translate-y-1 hover:shadow-neu-hover">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-background shadow-neu-inset text-primary flex items-center justify-center mb-4">
            <Users size={24} />
          </div>
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-2">People Ahead</p>
          <p className="text-4xl sm:text-5xl font-black text-foreground">{stats.waitingCount}</p>
        </div>

        <div className="bg-background shadow-neu rounded-3xl p-6 sm:p-8 text-center border-0 transition-all hover:-translate-y-1 hover:shadow-neu-hover">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-background shadow-neu-inset text-primary flex items-center justify-center mb-4">
            <Clock size={24} />
          </div>
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-2">Estimated Wait</p>
          <div className="flex items-baseline justify-center gap-1">
            <p className="text-4xl sm:text-5xl font-black text-foreground">{stats.estimatedTime}</p>
            <span className="text-sm font-bold text-muted-foreground">min</span>
          </div>
        </div>
      </div>

      {/* Service Details Inset Box */}
      <div className="bg-background shadow-neu-inset rounded-3xl p-6 sm:p-8 space-y-5 border-0">
        <div className="flex justify-between items-center text-sm sm:text-base border-b border-muted/10 pb-5">
          <div className="flex items-center gap-3 text-muted-foreground font-bold">
            <Sparkles size={18} className="text-primary" />
            <span>Active Counters</span>
          </div>
          <span className="font-extrabold text-foreground bg-background shadow-neu px-3 py-1 rounded-md">{stats.activeCounters}</span>
        </div>
        <div className="flex justify-between items-center text-sm sm:text-base pt-1">
          <div className="flex items-center gap-3 text-muted-foreground font-bold">
            <Clock size={18} className="text-primary" />
            <span>Average Service Time</span>
          </div>
          <span className="font-extrabold text-foreground">{service.averageServiceTime} <span className="text-xs font-semibold text-muted-foreground">min/person</span></span>
        </div>
      </div>

      {/* Sticky Bottom Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-background/80 backdrop-blur-md md:static md:bg-transparent md:backdrop-blur-none md:p-0 z-50">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={handleTakeToken}
            disabled={generating}
            className="w-full h-16 sm:h-20 text-lg sm:text-xl font-black text-primary bg-background shadow-neu hover:shadow-neu-hover hover:-translate-y-1 active:translate-y-0 active:shadow-neu-inset rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
          >
            {generating ? (
              <><Loader2 className="animate-spin" size={24} /> GENERATING PASS...</>
            ) : (
              'TAKE VIRTUAL PASS'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
