"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Navigation, Car, Clock, 
  MapPin, Bell, Compass, ShieldCheck 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistance } from '@/lib/geo/distance';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { EmptyState } from '@/components/common/EmptyState';
import { CitizenQueueSummary, LeaveTimeData, ApiResponse } from '@/types/citizen';

export default function WhenShouldILeaveScreen() {
  const [alarmSet, setAlarmSet] = useState(false);
  const [queueData, setQueueData] = useState<CitizenQueueSummary | null>(null);
  const [leaveAdvisory, setLeaveAdvisory] = useState<LeaveTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationPrompt, setLocationPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaveAdvisory = useCallback(async (tokenId: string, loc: { lat: number; lon: number } | null) => {
    try {
      const url = loc
        ? `/api/citizen/queue/${tokenId}/leave-time?lat=${loc.lat}&lng=${loc.lon}`
        : `/api/citizen/queue/${tokenId}/leave-time`;
      const res = await fetch(url);
      const json: ApiResponse<LeaveTimeData> = await res.json();
      if (json.success && json.data) {
        setLeaveAdvisory(json.data);
      }
    } catch (e: unknown) {
      console.error('Failed to fetch leave advisory', e);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchQueue = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/citizen/queue');
        const json: ApiResponse<CitizenQueueSummary> = await res.json();
        if (!isMounted) return;
        if (json.success && json.data) {
          setQueueData(json.data);
        } else {
          setError(json.message || 'No active queue token found');
        }
      } catch (err: unknown) {
        if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load queue');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchQueue();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!isMounted) return;
          const loc = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
          };
          setUserLocation(loc);
        },
        () => {
          if (isMounted) setLocationPrompt(true);
        }
      );
    }

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    if (queueData?.token?._id) {
      const run = async () => {
        await Promise.resolve();
        if (!ignore) {
          void fetchLeaveAdvisory(queueData.token._id, userLocation);
        }
      };
      void run();
    }
    return () => {
      ignore = true;
    };
  }, [queueData?.token?._id, userLocation, fetchLeaveAdvisory]);

  const requestGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude
        };
        setUserLocation(loc);
        setLocationPrompt(false);
        if (queueData?.token?._id) {
          fetchLeaveAdvisory(queueData.token._id, loc);
        }
      },
      () => alert('Please allow location access in your browser settings to compute travel time.')
    );
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto pt-4">
        <SkeletonLoader type="prediction" />
      </div>
    );
  }

  if (error || !queueData?.token) {
    return (
      <div className="max-w-md mx-auto pt-8">
        <EmptyState
          icon={<Car size={32} />}
          title="No Active Queue to Navigate To"
          description="Take a token first so the mobility engine can calculate when you should leave home."
          actionText="Explore Offices"
          actionHref="/citizen/offices"
        />
      </div>
    );
  }

  const { token, estimatedWaitMin } = queueData;
  const officeName = token.officeName || 'Not available';

  // Real Travel & Departure calculation from real routing provider
  const travelAvailable = Boolean(leaveAdvisory?.travelTimeAvailable);
  const travelTimeMin = travelAvailable ? (leaveAdvisory?.travelTimeMinutes ?? leaveAdvisory?.travelDurationMinutes ?? null) : null;
  const distanceKm = travelAvailable ? (leaveAdvisory?.distanceKm ?? leaveAdvisory?.travelDistanceKm ?? null) : null;
  const bufferTimeMin = leaveAdvisory?.checkInBufferMinutes ?? 5;
  const leaveInMin = travelAvailable ? (leaveAdvisory?.leaveInMinutes ?? null) : null;
  const recommendedDepartureTime = travelAvailable ? (leaveAdvisory?.recommendedDepartureTime ?? leaveAdvisory?.recommendedDepartureFormatted ?? null) : null;
  const targetArrivalTime = leaveAdvisory?.targetArrivalTime || 'On queue call';
  const expectedTurnTime = leaveAdvisory?.expectedCallTime || 'In turn';
  const adviceText = leaveAdvisory?.advice || 'Monitor live queue status.';

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Link href="/citizen/queue" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              Screen 23 • Live Queue
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">When Should I Leave?</h1>
          </div>
        </div>
      </div>

      {/* Hero Countdown Departure Banner */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-700 via-blue-700 to-slate-900 text-white shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-15">
          <Car size={130} />
        </div>
        <CardContent className="p-6 relative z-10 text-center">
          <div className="inline-flex items-center space-x-1.5 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-white/20">
            <Navigation size={14} className="text-emerald-300" />
            <span>Mobility Timing Engine • {travelAvailable ? 'GPS Road Route Active' : 'Travel time unavailable'}</span>
          </div>

          <p className="text-xs uppercase tracking-widest text-indigo-200 font-semibold">RECOMMENDED DEPARTURE</p>
          
          {travelAvailable && leaveInMin !== null ? (
            <>
              <div className="my-2">
                <span className="text-5xl font-black tracking-tight">
                  {leaveInMin === 0 ? 'Leave Now' : `Leave in ${leaveInMin}m`}
                </span>
              </div>
              <p className="text-xs text-indigo-100">
                Target departure: <strong className="text-white text-sm">{recommendedDepartureTime}</strong>
              </p>
            </>
          ) : (
            <>
              <div className="my-3">
                <span className="text-2xl font-bold tracking-tight text-amber-200">
                  Travel time unavailable
                </span>
              </div>
              <p className="text-xs text-indigo-100 max-w-xs mx-auto">
                Please arrive by <strong className="text-white">{targetArrivalTime}</strong> to check in before your turn.
              </p>
            </>
          )}

          <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-white/20 text-xs text-left">
            <div>
              <p className="text-[10px] uppercase font-bold text-indigo-200">Expected Turn</p>
              <p className="text-base font-bold text-white mt-0.5">
                {expectedTurnTime}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-indigo-200">Travel + Buffer</p>
              <p className="text-base font-bold text-emerald-300 mt-0.5">
                {travelAvailable ? `${travelTimeMin}m + ${bufferTimeMin}m` : `Unavailable + ${bufferTimeMin}m`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GPS Location Prompt if not enabled */}
      {locationPrompt && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <Compass size={18} className="text-amber-600 shrink-0" />
            <span>Enable GPS to compute live road travel time</span>
          </div>
          <Button size="sm" onClick={requestGPS} className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8">
            Enable GPS
          </Button>
        </div>
      )}

      {/* Journey Breakdown */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardContent className="p-5 space-y-4 text-xs">
          <h3 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">Journey Timing Breakdown</h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center">
                <MapPin size={13} className="mr-1.5 text-blue-500" /> Destination Office
              </span>
              <span className="font-bold text-slate-800 text-right truncate max-w-[200px]">{officeName}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center">
                <Clock size={13} className="mr-1.5 text-amber-500" /> Current Queue Wait
              </span>
              <span className="font-bold text-slate-800">{estimatedWaitMin} mins</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center">
                <Car size={13} className="mr-1.5 text-indigo-500" /> Road Travel Duration
              </span>
              <span className="font-bold text-slate-800">
                {travelAvailable 
                  ? `${travelTimeMin} mins ${distanceKm ? `(${formatDistance(distanceKm)})` : ''}`
                  : 'Travel time unavailable'
                }
              </span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center">
                <ShieldCheck size={13} className="mr-1.5 text-emerald-500" /> Check-in Buffer
              </span>
              <span className="font-bold text-emerald-600">{bufferTimeMin} mins</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center">
                <Navigation size={13} className="mr-1.5 text-purple-500" /> Target Arrival
              </span>
              <span className="font-bold text-purple-700">{targetArrivalTime}</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            <p>{adviceText}</p>
          </div>
        </CardContent>
      </Card>

      {/* Alarm Notification Toggle */}
      <Button
        onClick={() => setAlarmSet(!alarmSet)}
        className={`w-full h-11 text-xs font-bold transition-all shadow-sm ${
          alarmSet ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        <Bell size={14} className="mr-2" />
        {alarmSet ? 'Departure Reminder Active!' : 'Notify Me When It Is Time to Leave'}
      </Button>
    </div>
  );
}
