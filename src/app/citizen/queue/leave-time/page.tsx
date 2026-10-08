"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Navigation, Car, Clock, 
  MapPin, Bell, CheckCircle2, AlertCircle, Compass, ShieldCheck 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { calculateDistanceKm, formatDistance } from '@/lib/geo/distance';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { EmptyState } from '@/components/common/EmptyState';

export default function WhenShouldILeaveScreen() {
  const [alarmSet, setAlarmSet] = useState(false);
  const [queueData, setQueueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationPrompt, setLocationPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/citizen/queue');
        const json = await res.json();
        if (json.success && json.data) {
          setQueueData(json.data);
        } else {
          setError(json.message || 'No active queue token found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load queue');
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
          });
        },
        () => {
          setLocationPrompt(true);
        }
      );
    }
  }, []);

  const requestGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude
        });
        setLocationPrompt(false);
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
  const officeName = token.officeName || 'Government Office';

  // Compute travel time based on distance
  let distanceKm: number | null = null;
  let travelTimeMin = 15; // default fallback if GPS unavailable
  let travelSource: 'GPS' | 'FALLBACK' = 'FALLBACK';

  if (userLocation && token.officeLatitude && token.officeLongitude) {
    distanceKm = calculateDistanceKm(userLocation.lat, userLocation.lon, token.officeLatitude, token.officeLongitude);
    travelTimeMin = Math.max(5, Math.round(distanceKm * 2.5)); // ~25km/h in city
    travelSource = 'GPS';
  }

  const bufferTimeMin = 5;
  const totalTravelNeeded = travelTimeMin + bufferTimeMin;
  const leaveInMin = Math.max(1, estimatedWaitMin - totalTravelNeeded);

  const now = new Date();
  const departureDate = new Date(now.getTime() + leaveInMin * 60000);
  const expectedTurnDate = new Date(now.getTime() + estimatedWaitMin * 60000);

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
            <span>Mobility Timing Engine • {travelSource === 'GPS' ? 'GPS Active' : 'Estimated'}</span>
          </div>

          <p className="text-xs uppercase tracking-widest text-indigo-200 font-semibold">RECOMMENDED DEPARTURE</p>
          <div className="my-2">
            <span className="text-5xl font-black tracking-tight">Leave in {leaveInMin}m</span>
          </div>
          
          <p className="text-xs text-indigo-100">
            Target departure: <strong className="text-white text-sm">{departureDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</strong>
          </p>

          <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-white/20 text-xs text-left">
            <div>
              <p className="text-[10px] uppercase font-bold text-indigo-200">Expected Turn</p>
              <p className="text-base font-bold text-white mt-0.5">
                {expectedTurnDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-indigo-200">Travel + Buffer</p>
              <p className="text-base font-bold text-emerald-300 mt-0.5">{travelTimeMin}m + {bufferTimeMin}m</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GPS Location Prompt if not enabled */}
      {locationPrompt && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <Compass size={18} className="text-amber-600 shrink-0" />
            <span>Enable GPS for precise live road travel calculation</span>
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
              <span className="font-bold text-slate-800">{travelTimeMin} mins {distanceKm ? `(${formatDistance(distanceKm)})` : ''}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center">
                <ShieldCheck size={13} className="mr-1.5 text-emerald-500" /> Security Buffer
              </span>
              <span className="font-bold text-emerald-600">{bufferTimeMin} mins</span>
            </div>
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
