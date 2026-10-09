"use client";
import Link from 'next/link';
import { ArrowLeft, Clock, Users, Briefcase, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CitizenService, CitizenOffice, QueueMetrics, ApiResponse } from '@/types/citizen';

export default function ServiceDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [data, setData] = useState<{ service: CitizenService, office: CitizenOffice, stats: QueueMetrics } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        const res = await fetch(`/api/citizen/services/${id}`);
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
  }, [id]);

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
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-12 text-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl inline-block mb-4">
          <Info size={32} className="mx-auto mb-2" />
          <p>{error || 'Service not found'}</p>
        </div>
        <div>
          <Button variant="ghost" onClick={() => router.back()} className="text-blue-600">
            ← Go Back
          </Button>
        </div>
      </div>
    );
  }

  const { service, office, stats } = data;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center mb-6">
        <button onClick={() => router.back()} className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Briefcase size={36} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{service.name}</h1>
        <p className="text-slate-500">{office?.name || 'Unknown Office'}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-sm">
          <Users size={24} className="text-blue-500 mx-auto mb-2" />
          <p className="text-sm text-slate-500 mb-1">People Ahead</p>
          <p className="text-2xl font-bold text-slate-900">{stats.waitingCount}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-sm">
          <Clock size={24} className="text-amber-500 mx-auto mb-2" />
          <p className="text-sm text-slate-500 mb-1">Estimated Wait</p>
          <p className="text-2xl font-bold text-slate-900">{stats.estimatedTime}<span className="text-sm font-medium text-slate-500 ml-1">min</span></p>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Active Counters</span>
          <span className="font-semibold text-slate-900">{stats.activeCounters}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Average Service Time</span>
          <span className="font-semibold text-slate-900">{service.averageServiceTime} minutes</span>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 md:static md:bg-transparent md:border-0 md:p-0 z-10">
        <div className="max-w-4xl mx-auto">
          <Button 
            className="w-full h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
            onClick={handleTakeToken}
            disabled={generating}
          >
            {generating ? (
              <><Loader2 className="animate-spin mr-2" /> GENERATING...</>
            ) : (
              'TAKE VIRTUAL TOKEN'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
