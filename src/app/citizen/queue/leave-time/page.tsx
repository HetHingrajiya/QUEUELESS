"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Navigation, Car, Clock, ShieldCheck, 
  MapPin, Bell, CheckCircle2, AlertCircle, Compass, RefreshCw 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function WhenShouldILeaveScreen() {
  const [alarmSet, setAlarmSet] = useState(false);
  const [countdownMinutes, setCountdownMinutes] = useState(7);

  const tripData = {
    destination: "Regional Transport Office (RTO Rajkot)",
    address: "Civil Center, Ring Road",
    distanceKm: "4.2 km",
    travelTimeMin: 14,
    trafficCondition: "LIGHT TRAFFIC",
    queueWaitMin: 22,
    bufferTimeMin: 5,
    recommendedDeparture: "10:32 AM",
    expectedTurnTime: "10:55 AM"
  };

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
            <span>Smart Mobility Timing Engine</span>
          </div>

          <p className="text-xs uppercase tracking-widest text-indigo-200 font-semibold">RECOMMENDED DEPARTURE</p>
          <div className="my-2">
            <span className="text-5xl font-black tracking-tight">Leave in {countdownMinutes}m</span>
          </div>
          
          <p className="text-xs text-indigo-100">
            Depart at <strong className="text-white text-sm">{tripData.recommendedDeparture}</strong> to arrive right as your token is called.
          </p>

          {/* Time Decomposition Box */}
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/20 mt-6 space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-indigo-100 border-b border-white/10 pb-2">
              <span className="flex items-center">
                <Car size={14} className="mr-2 text-indigo-300" /> Travel Duration
              </span>
              <strong className="text-white">{tripData.travelTimeMin} mins ({tripData.distanceKm})</strong>
            </div>
            <div className="flex justify-between items-center text-indigo-100 border-b border-white/10 pb-2">
              <span className="flex items-center">
                <ShieldCheck size={14} className="mr-2 text-emerald-300" /> Check-in & Security Buffer
              </span>
              <strong className="text-white">+{tripData.bufferTimeMin} mins</strong>
            </div>
            <div className="flex justify-between items-center text-indigo-100">
              <span className="flex items-center">
                <Clock size={14} className="mr-2 text-amber-300" /> Estimated Service Call
              </span>
              <strong className="text-amber-300 font-bold">{tripData.expectedTurnTime}</strong>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Traffic & Route Status */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Compass size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{tripData.destination}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{tripData.address}</p>
              </div>
            </div>
            <span className="bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2.5 py-1 rounded-full border border-emerald-200">
              {tripData.trafficCondition}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Auto-adjusted for real-time speed</span>
            <span className="text-slate-400">GPS Sync Active</span>
          </div>
        </CardContent>
      </Card>

      {/* Departure Reminder Alarm */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${alarmSet ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
              <Bell size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Departure Push Notification</p>
              <p className="text-[11px] text-slate-500">Alert me 2 minutes before it's time to leave</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setAlarmSet(!alarmSet)}
            className={alarmSet ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'}
          >
            {alarmSet ? 'Enabled' : 'Set Alarm'}
          </Button>
        </CardContent>
      </Card>

      {/* Action CTA */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <a 
          href="https://maps.google.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="block w-full"
        >
          <Button variant="outline" className="w-full h-12 text-xs font-semibold border-slate-300">
            Open in Google Maps
          </Button>
        </a>
        <Link href="/citizen/queue" className="block w-full">
          <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-xs font-semibold shadow-md">
            Return to Live Queue
          </Button>
        </Link>
      </div>
    </div>
  );
}
