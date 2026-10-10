"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  MapPin, CheckCircle2, ShieldCheck, 
  ArrowLeft, AlertCircle, Compass, Zap 
} from 'lucide-react';

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
    <div className="space-y-6 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      
      {/* Header */}
      <div className="flex items-center mb-8">
        <Link href="/citizen/settings/privacy">
          <button className="w-12 h-12 mr-4 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-full transition-all text-muted-foreground hover:text-foreground shrink-0">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Location Services</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold">Enable GPS for smart queue features.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Column: Interactive Authorization */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-10 text-center border-0 flex flex-col items-center">
            
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-10">Sensor Access</p>

            <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center mb-10 transition-all duration-500 ${
              status === 'granted'
                ? 'bg-background shadow-neu text-emerald-500'
                : status === 'denied'
                ? 'bg-background shadow-neu-inset text-red-500'
                : 'bg-background shadow-neu-inset text-primary'
            }`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                status === 'granted' ? 'shadow-neu-inset' : 'shadow-neu'
              }`}>
                {status === 'granted' ? <CheckCircle2 size={32} /> : <MapPin size={32} />}
              </div>
            </div>

            <h2 className="text-xl font-black text-foreground tracking-tight mb-2">Device Location</h2>
            <p className="text-xs font-semibold text-muted-foreground mb-8">Requires explicit browser permission</p>

            <button
              onClick={requestPermission}
              disabled={status === 'granted'}
              className={`w-full h-16 rounded-[2rem] text-sm uppercase font-black tracking-widest flex items-center justify-center transition-all ${
                status === 'granted'
                  ? 'bg-background shadow-neu-inset text-emerald-500 cursor-not-allowed'
                  : 'bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset text-primary'
              }`}
            >
              {status === 'granted' ? 'Access Granted' : 'Allow Access'}
            </button>

            {status === 'granted' && coords && (
              <div className="w-full mt-6 bg-background shadow-neu-inset p-4 rounded-2xl border-2 border-emerald-500/20 text-emerald-500 text-xs font-black uppercase tracking-widest">
                Lat: {coords.lat.toFixed(4)} / Lng: {coords.lng.toFixed(4)}
              </div>
            )}

            {status === 'denied' && (
              <div className="w-full mt-6 bg-background shadow-neu-inset p-4 rounded-2xl border-2 border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center text-left">
                <AlertCircle size={16} className="mr-3 shrink-0" /> Permission Denied in browser
              </div>
            )}
          </div>

          <Link href="/citizen/home" className="block w-full">
            <button className="w-full h-14 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl text-xs uppercase font-black tracking-widest text-muted-foreground flex items-center justify-center transition-all">
              Continue to Dashboard
            </button>
          </Link>
        </div>

        {/* Right Column: Features Explained */}
        <div className="lg:col-span-8">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-8 sm:p-10 border-0">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-8">Why we need your location</h3>
            
            <div className="space-y-6">
              
              {/* Feature 1 */}
              <div className="bg-background shadow-neu-inset p-6 sm:p-8 rounded-[2rem] flex flex-col sm:flex-row sm:items-start gap-6 border-0 group">
                <div className="w-14 h-14 rounded-2xl bg-background shadow-neu flex items-center justify-center text-primary shrink-0 transition-transform group-hover:-translate-y-1">
                  <Zap size={24} />
                </div>
                <div>
                  <h4 className="font-black text-lg text-foreground mb-2">Automatic Geofence Check-In</h4>
                  <p className="text-sm font-semibold text-muted-foreground leading-relaxed">
                    Automatically checks you in the precise moment you step into the physical bounds of the government office. Skip the chaotic kiosk lines and let the system detect your arrival.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-background shadow-neu-inset p-6 sm:p-8 rounded-[2rem] flex flex-col sm:flex-row sm:items-start gap-6 border-0 group">
                <div className="w-14 h-14 rounded-2xl bg-background shadow-neu flex items-center justify-center text-amber-500 shrink-0 transition-transform group-hover:-translate-y-1">
                  <Compass size={24} />
                </div>
                <div>
                  <h4 className="font-black text-lg text-foreground mb-2">Smart Departure Alerts</h4>
                  <p className="text-sm font-semibold text-muted-foreground leading-relaxed">
                    By knowing your starting point, we dynamically calculate real-time driving or transit times. You will be notified exactly when to leave your house so you walk in right when your token is called.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="bg-background shadow-neu-inset p-6 sm:p-8 rounded-[2rem] flex flex-col sm:flex-row sm:items-start gap-6 border-0 group">
                <div className="w-14 h-14 rounded-2xl bg-background shadow-neu flex items-center justify-center text-emerald-500 shrink-0 transition-transform group-hover:-translate-y-1">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4 className="font-black text-lg text-foreground mb-2">Strictly Geofenced Privacy</h4>
                  <p className="text-sm font-semibold text-muted-foreground leading-relaxed">
                    Your location is completely private. We never track your location in the background once your token lifecycle is complete or if you leave the venue premises.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
