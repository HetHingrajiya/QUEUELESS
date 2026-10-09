"use client";
import { useState, useEffect, useCallback, use } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, MapPin, AlertCircle, ShieldCheck, Compass } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LeaveTimeData, ApiResponse } from '@/types/citizen';

export default function LeaveTimePage({ params }: { params: Promise<{ tokenId: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const tokenId = unwrappedParams.tokenId;

  const [data, setData] = useState<LeaveTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationPrompt, setLocationPrompt] = useState(false);

  const fetchLeaveTime = useCallback(async (lat?: number, lng?: number) => {
    try {
      setLoading(true);
      const url = (lat !== undefined && lng !== undefined)
        ? `/api/citizen/queue/${tokenId}/leave-time?lat=${lat}&lng=${lng}`
        : `/api/citizen/queue/${tokenId}/leave-time`;
      const res = await fetch(url);
      const json: ApiResponse<LeaveTimeData> = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err: unknown) {
      console.error("Failed to load leave time", err);
    } finally {
      setLoading(false);
    }
  }, [tokenId]);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      await Promise.resolve();
      if (!isMounted) return;
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (isMounted) void fetchLeaveTime(pos.coords.latitude, pos.coords.longitude);
          },
          () => {
            if (isMounted) {
              setLocationPrompt(true);
              void fetchLeaveTime();
            }
          }
        );
      } else {
        void fetchLeaveTime();
      }
    };
    void init();
    return () => {
      isMounted = false;
    };
  }, [tokenId, fetchLeaveTime]);

  const [gpsError, setGpsError] = useState<string | null>(null);

  const requestGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationPrompt(false);
        setGpsError(null);
        fetchLeaveTime(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setGpsError('Location access was denied. Please allow location in browser settings to calculate live travel time.');
      }
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
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
          <MapPin className="text-indigo-600 mr-2" size={24} />
          When Should I Leave?
        </h2>
      </div>

      {gpsError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0 text-red-500" />
          <span>{gpsError}</span>
        </div>
      )}

      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 shadow-sm overflow-hidden">
        <div className="bg-indigo-600 h-1.5 w-full"></div>
        <CardContent className="p-6 text-center">
          {!data?.travelTimeAvailable ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-2">
                <AlertCircle size={44} className="text-amber-500 mb-3" />
                <h3 className="text-lg font-bold text-slate-700 mb-1">Travel time unavailable</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Routing provider or live location is currently unavailable. Queue predictions are provided separately below.
                </p>
              </div>

              {locationPrompt && (
                <div className="p-3 bg-amber-100/60 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800">
                  <span className="flex items-center gap-1.5">
                    <Compass size={16} className="text-amber-600" /> Enable GPS for road travel time
                  </span>
                  <Button size="sm" onClick={requestGPS} className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-7">
                    Enable
                  </Button>
                </div>
              )}

              {/* Queue Prediction Displayed Separately */}
              <div className="bg-white/90 rounded-xl p-4 text-left border border-indigo-100 space-y-2.5 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Token Number</span>
                  <span className="font-bold text-slate-800">{data?.tokenNumber}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Current Queue Wait</span>
                  <span className="font-bold text-indigo-600">{data?.predictedWaitMinutes ?? 0} mins</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Target Office Arrival</span>
                  <span className="font-bold text-emerald-600">{data?.targetArrivalTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Check-in Buffer</span>
                  <span className="font-bold text-slate-700">{data?.checkInBufferMinutes ?? 5} mins</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Please plan to arrive at {data?.officeName} by {data?.targetArrivalTime} to check in before your turn.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                {data.urgency === 'LEAVE_NOW' ? 'Depart Immediately' : (data.urgency === 'PREPARE' ? 'Prepare Departure' : 'Relax - You Have Time')}
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Recommended Departure Time</p>
                <div className="flex items-baseline justify-center space-x-1 my-1">
                  <span className="text-5xl font-black text-slate-900 tracking-tight">{data.recommendedDepartureTime}</span>
                </div>
                <p className="text-xs text-slate-500">
                  Target Arrival: <strong className="text-slate-700">{data.targetArrivalTime}</strong> (Buffer: {data.checkInBufferMinutes}m)
                </p>
              </div>

              <div className="bg-white/80 rounded-xl p-3.5 text-left border border-indigo-100 space-y-2 text-xs">
                <p className="font-medium text-slate-700">{data.advice}</p>
                <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>Transit Duration: {data.travelTimeMinutes} mins {data.distanceKm ? `(${data.distanceKm} km)` : ''}</span>
                  <span>Est. Wait: {data.predictedWaitMinutes} mins</span>
                </div>
              </div>

              <div className="flex items-center justify-center text-[11px] text-slate-400 space-x-1 pt-1">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Verified by Road Routing Provider ({data.routingProvider || 'OSRM'})</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-center">
        <Button variant="outline" onClick={() => router.back()} className="w-full">
          Back to Live Queue
        </Button>
      </div>
    </div>
  );
}
