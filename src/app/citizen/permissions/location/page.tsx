"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  MapPin, CheckCircle2, ShieldCheck, 
  ArrowRight, ArrowLeft, AlertCircle, Compass, Zap 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function LocationPermissionPage() {
  const [status, setStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const requestPermission = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStatus('granted');
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        setStatus('denied');
      }
    );
  };

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-6 text-center">
      {/* Location Pin Graphic */}
      <div className="relative inline-block mx-auto">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all ${
          status === 'granted'
            ? 'bg-emerald-100 text-emerald-600 ring-8 ring-emerald-400/20'
            : status === 'denied'
            ? 'bg-red-100 text-red-600 ring-8 ring-red-400/20'
            : 'bg-blue-100 text-blue-600 ring-8 ring-blue-400/20'
        }`}>
          {status === 'granted' ? (
            <CheckCircle2 size={50} />
          ) : (
            <MapPin size={50} />
          )}
        </div>
      </div>

      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          Screen 58 • Device Permission
        </span>
        <h1 className="text-2xl font-black text-slate-900 mt-2">Location Services</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          QueueLess uses precise location to unlock seamless smart queue features.
        </p>
      </div>

      {/* Rationale Perks */}
      <Card className="border-slate-200 text-left shadow-sm">
        <CardContent className="p-5 space-y-4 text-xs">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Zap size={16} />
            </div>
            <div>
              <p className="font-bold text-slate-900">Automatic Geofence Check-In</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Automatically checks you in the moment you step into the government office gate without kiosk queues.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Compass size={16} />
            </div>
            <div>
              <p className="font-bold text-slate-900">&ldquo;When Should I Leave&rdquo; Departure Alerts</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Calculates live driving/transit times from your current location so you arrive right when called.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={16} />
            </div>
            <div>
              <p className="font-bold text-slate-900">Privacy Guaranteed</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Location is never tracked in the background after your token lifecycle is complete.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Output */}
      {status === 'granted' && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold">
          ✓ Location permission granted! Lat: {coords?.lat.toFixed(4)}, Lng: {coords?.lng.toFixed(4)}
        </div>
      )}

      {status === 'denied' && (
        <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs font-semibold">
          Location was denied. You can still use manual kiosk check-in with your token QR pass.
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <Button
          onClick={requestPermission}
          disabled={status === 'granted'}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold shadow-md"
        >
          {status === 'granted' ? 'Permission Already Active' : 'Allow Location Access'}
        </Button>
        <Link href="/citizen/home" className="block w-full">
          <Button variant="ghost" className="w-full text-xs text-slate-500">
            Continue to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
