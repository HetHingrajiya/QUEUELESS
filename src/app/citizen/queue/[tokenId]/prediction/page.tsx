"use client";
import { useState, useEffect, use } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, BrainCircuit, Clock, Zap, Target, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AIPrediction, ApiResponse } from '@/types/citizen';

export default function PredictionInsightPage({ params }: { params: Promise<{ tokenId: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const tokenId = unwrappedParams.tokenId;

  const [data, setData] = useState<AIPrediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const res = await fetch(`/api/citizen/queue/${tokenId}/prediction`);
        const json: ApiResponse<AIPrediction> = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        }
      } catch (err: unknown) {
        console.error("Failed to load prediction", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrediction();
  }, [tokenId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-slate-800">No AI Data Available</h2>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 max-w-md mx-auto pt-4 px-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" className="mr-2 -ml-2 text-slate-500" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-xl font-bold text-slate-800 flex items-center">
          <BrainCircuit className="text-purple-600 mr-2" size={24} />
          AI Wait Time Insight
        </h2>
      </div>

      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-sm overflow-hidden">
        <div className="bg-purple-600 h-1.5 w-full"></div>
        <CardContent className="p-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-600 mb-2">Predicted Wait Time</p>
          <div className="flex items-end justify-center space-x-1 mb-2">
            <span className="text-6xl font-black text-slate-900 tracking-tighter">{data.predictedWaitTime}</span>
            <span className="text-xl font-medium text-slate-500 mb-1.5">mins</span>
          </div>
          <p className="text-sm text-slate-600">For Token <span className="font-bold">{data.tokenNumber}</span> ({data.serviceName})</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center space-x-3 shadow-sm">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
            <Target size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Confidence</p>
            <p className="text-lg font-bold text-slate-900">{data.confidence && Number(data.confidence) > 0 ? `${Math.round(Number(data.confidence) <= 1 ? Number(data.confidence) * 100 : Number(data.confidence))}%` : 'Not available'}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center space-x-3 shadow-sm">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Status</p>
            <p className="text-sm font-bold text-slate-900">Live Sync</p>
          </div>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center">
            <Zap className="text-amber-500 mr-2" size={16} />
            Prediction Factors
          </h3>
          <div className="space-y-4">
            {data.factors && typeof data.factors === 'object' && Object.entries(data.factors as Record<string, string>).map(([factor, impact], i) => (
              <div key={i} className="flex justify-between items-center border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                <span className="text-sm font-medium text-slate-700 flex items-center">
                  <Clock size={14} className="mr-2 text-slate-400" />
                  {factor}
                </span>
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                  impact === 'High Impact' ? 'bg-red-100 text-red-700' :
                  impact === 'Medium Impact' ? 'bg-amber-100 text-amber-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {String(impact)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <p className="text-xs text-center text-slate-400 italic mt-4 px-4">
        This prediction is powered by our Random Forest ML model, dynamically adjusting to live queue conditions.
      </p>
    </div>
  );
}
