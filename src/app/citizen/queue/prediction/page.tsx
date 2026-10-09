"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, BrainCircuit, Zap, Activity, Sparkles, AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AIPrediction, ApiResponse, CitizenQueueSummary } from '@/types/citizen';

type TrendBar = { hour: string; wait: number; current: boolean };
type PredictionFactor = { name: string; impact: 'High Impact' | 'Medium Impact' | 'Low Impact'; desc: string };

type PredictionView = {
  tokenNumber: string;
  serviceName: string;
  officeName: string;
  predictedWaitTime: number | null;
  confidence: number | null;
  predictionSource: string;
  modelVersion: string;
  factors: PredictionFactor[];
  hourlyTrends: TrendBar[];
  bestWindow: string | null;
  error: string | null;
};

const emptyPrediction: PredictionView = {
  tokenNumber: '',
  serviceName: '',
  officeName: '',
  predictedWaitTime: null,
  confidence: null,
  predictionSource: '',
  modelVersion: '',
  factors: [],
  hourlyTrends: [],
  bestWindow: null,
  error: null,
};

export default function AIWaitPredictionScreen() {
  const [prediction, setPrediction] = useState<PredictionView>(emptyPrediction);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadRealPrediction() {
      try {
        const queueRes = await fetch('/api/citizen/queue', { cache: 'no-store' });
        const queueJson: ApiResponse<CitizenQueueSummary> = await queueRes.json();

        if (!queueRes.ok || !queueJson.success) {
          throw new Error(queueJson.message || 'Unable to load your active queue.');
        }
        if (!queueJson.data?.token?._id) {
          throw new Error('You do not have an active token. Get a token before viewing its wait-time prediction.');
        }

        const token = queueJson.data.token;
        const predRes = await fetch(`/api/citizen/queue/${token._id}/prediction`, { cache: 'no-store' });
        const predJson: ApiResponse<AIPrediction> = await predRes.json();
        if (!predRes.ok || !predJson.success || !predJson.data) {
          throw new Error(predJson.message || 'Prediction data is currently unavailable.');
        }

        const pred = predJson.data;
        const isFallback = (pred.predictionSource || '').toUpperCase().includes('FALLBACK');
        const factors: PredictionFactor[] = [
          { name: 'People Ahead', impact: 'High Impact', desc: `${pred.waitingAhead} citizens are ahead in your queue.` },
          { name: 'Active Counters', impact: 'High Impact', desc: `${pred.activeCounters} active counter(s) are serving this queue.` },
        ];

        if (!isFallback && pred.queueHealth) {
          factors.push({
            name: 'Queue Health',
            impact: 'Medium Impact',
            desc: `Current queue status: ${pred.queueHealth.status} (${pred.queueHealth.score}/100).`,
          });
        }
        if (!isFallback && pred.serviceTimePrediction?.predicted_service_time_mins != null) {
          factors.push({
            name: 'Predicted Service Pace',
            impact: 'Medium Impact',
            desc: `Estimated service duration: ${pred.serviceTimePrediction.predicted_service_time_mins} minutes.`,
          });
        }
        if (!isFallback && pred.bestTimeToVisit?.best_window) {
          factors.push({
            name: 'Best Time to Visit',
            impact: 'Low Impact',
            desc: `The analytics engine identifies ${pred.bestTimeToVisit.best_window} as a recommended window.`,
          });
        }
        if (pred.predictionSource || pred.modelVersion) {
          factors.push({
            name: 'Prediction Source',
            impact: 'Low Impact',
            desc: [pred.predictionSource, pred.modelVersion].filter(Boolean).join(' · '),
          });
        }

        const rawTrends = pred.crowdPrediction?.hourly_trends;
        // A statistical fallback has no observed hourly series. Do not graph its illustrative values as real traffic.
        const trends: TrendBar[] = (isFallback ? [] : (rawTrends || []))
          .filter((item) => typeof item.wait === 'number' && Number.isFinite(item.wait))
          .map((item) => ({ hour: item.hour, wait: item.wait, current: Boolean(item.current) }));

        if (!cancelled) {
          setPrediction({
            tokenNumber: pred.tokenNumber || token.tokenNumber,
            serviceName: pred.serviceName || token.serviceName || 'Service',
            officeName: token.officeName || 'Government office',
            predictedWaitTime: Number.isFinite(pred.predictedWaitTime) ? pred.predictedWaitTime : null,
            confidence: pred.confidence == null ? null : Math.round(Math.max(0, Math.min(1, Number(pred.confidence) > 1 ? Number(pred.confidence) / 100 : Number(pred.confidence))) * 100),
            predictionSource: pred.predictionSource || 'Unavailable',
            modelVersion: pred.modelVersion || '',
            factors,
            hourlyTrends: trends,
            bestWindow: !isFallback ? (pred.bestTimeToVisit?.best_window || null) : null,
            error: null,
          });
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setPrediction({ ...emptyPrediction, error: error instanceof Error ? error.message : 'Failed to load prediction data.' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadRealPrediction();
    return () => { cancelled = true; };
  }, []);

  const hasPrediction = prediction.predictedWaitTime !== null;

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-2">
      <div className="flex items-center mb-2">
        <Link href="/citizen/queue/my" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500" aria-label="Back to My Queue">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-slate-900">AI Wait Prediction</h1>
      </div>

      {loading ? (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6 space-y-4 animate-pulse">
            <div className="h-4 w-40 bg-slate-200 rounded mx-auto" />
            <div className="h-14 w-28 bg-slate-200 rounded mx-auto" />
            <div className="h-4 w-56 bg-slate-100 rounded mx-auto" />
            <div className="h-16 bg-slate-100 rounded-xl" />
          </CardContent>
        </Card>
      ) : !hasPrediction ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-amber-600 mb-2" />
          <h2 className="font-bold text-slate-900">Prediction unavailable</h2>
          <p className="text-sm text-slate-600 mt-2">{prediction.error || 'The system did not return a valid prediction for this token.'}</p>
          <Link href="/citizen/offices" className="inline-block mt-4">
            <Button className="bg-blue-600 hover:bg-blue-700">Explore offices</Button>
          </Link>
        </div>
      ) : (
        <>
          <Card className="border-purple-200 bg-gradient-to-br from-purple-700 via-indigo-700 to-blue-700 text-white shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-15"><BrainCircuit size={130} /></div>
            <CardContent className="p-6 relative z-10 text-center">
              <div className="inline-flex items-center space-x-1.5 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-white/20">
                <Sparkles size={14} className="text-amber-300" />
                <span>{prediction.predictionSource.toUpperCase().includes('FALLBACK') ? 'Statistical estimate' : 'Queue prediction engine'}</span>
              </div>
              <p className="text-xs uppercase tracking-widest text-purple-200 font-semibold">Predicted wait time</p>
              <div className="flex items-baseline justify-center space-x-1 my-2">
                <span className="text-6xl font-black tracking-tight">{prediction.predictedWaitTime}</span>
                <span className="text-2xl font-bold text-purple-200">mins</span>
              </div>
              <p className="text-xs text-purple-100">
                Token <strong className="text-white">{prediction.tokenNumber}</strong> · {prediction.serviceName}
              </p>
              <p className="text-xs text-purple-100 mt-1">{prediction.officeName}</p>
              <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-md border border-white/20 mt-5 text-left">
                <p className="text-[10px] text-purple-200 uppercase font-semibold">Model confidence</p>
                <p className="text-lg font-bold text-emerald-300">{prediction.confidence === null ? 'Not available' : `${prediction.confidence}%`}</p>
                <p className="text-[11px] text-purple-100 mt-1">Source: {prediction.predictionSource}{prediction.modelVersion ? ` · ${prediction.modelVersion}` : ''}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center">
                  <Activity size={15} className="mr-2 text-blue-600" /> Office traffic trend
                </h3>
                {prediction.bestWindow && <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">Recommended window</span>}
              </div>
              {prediction.hourlyTrends.length > 0 ? (
                <>
                  <div className="flex items-end justify-between min-h-32 pt-6 pb-2 px-2 border-b border-slate-100">
                    {prediction.hourlyTrends.map((bar, idx) => {
                      const maxWait = Math.max(...prediction.hourlyTrends.map((item) => item.wait), 1);
                      return (
                        <div key={`${bar.hour}-${idx}`} className="flex flex-col items-center flex-1">
                          <span className="text-[10px] font-bold text-slate-500 mb-1">{bar.wait}m</span>
                          <div
                            className={`w-6 rounded-t-lg transition-all ${bar.current ? 'bg-gradient-to-t from-purple-600 to-indigo-600 shadow-md ring-2 ring-purple-300' : 'bg-slate-200'}`}
                            style={{ height: `${Math.max(4, (bar.wait / maxWait) * 80)}px` }}
                          />
                          <span className={`text-[10px] mt-2 font-medium ${bar.current ? 'text-purple-700 font-bold' : 'text-slate-400'}`}>{bar.hour}</span>
                        </div>
                      );
                    })}
                  </div>
                  {prediction.bestWindow && <p className="text-[11px] text-slate-500 text-center mt-2">Recommended window: {prediction.bestWindow}</p>}
                </>
              ) : (
                <p className="text-sm text-slate-500">Hourly traffic data is not available for this queue yet.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center">
                <Zap size={15} className="mr-2 text-amber-500" /> Model influence factors
              </h3>
              {prediction.factors.length > 0 ? (
                <div className="space-y-3">
                  {prediction.factors.map((factor, idx) => (
                    <div key={`${factor.name}-${idx}`} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-800">{factor.name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${factor.impact === 'High Impact' ? 'bg-red-100 text-red-700' : factor.impact === 'Medium Impact' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{factor.impact}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{factor.desc}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Prediction factors are not available.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <div className="text-center">
        <Link href="/citizen/queue/leave-time">
          <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-semibold shadow-md">Calculate Best Departure Time</Button>
        </Link>
      </div>
    </div>
  );
}
