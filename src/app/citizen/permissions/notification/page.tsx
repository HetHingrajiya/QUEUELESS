"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  Bell, Volume2, ShieldCheck, CheckCircle2, 
  ArrowLeft, Clock 
} from 'lucide-react';

export default function NotificationPermissionPage() {
  const [status, setStatus] = useState<'default' | 'granted' | 'denied'>('default');

  const requestNotification = async () => {
    if (!('Notification' in window)) {
      alert("This browser does not support system push notifications.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setStatus(permission);
      if (permission === 'granted') {
        new Notification("SamaySetu Live Chime", {
          body: "Notifications enabled! You will be alerted the second your token is called.",
          icon: "/favicon.ico"
        });
      }
    } catch {
      setStatus('granted'); // Fallback simulation
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      
      {/* Header */}
      <div className="flex items-center mb-8 px-4 sm:px-6 lg:px-8">
        <Link href="/citizen/settings">
          <button className="w-12 h-12 mr-4 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-full transition-all text-muted-foreground hover:text-foreground shrink-0 border-0">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">System Permissions</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold">Enable audio chimes and lock screen alerts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 px-4 sm:px-6 lg:px-8">
        
        {/* Left Column: Interactive State & Action */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-10 text-center border-0 flex flex-col items-center justify-center min-h-[400px]">
            
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-8">Push Notifications</p>
            
            <div className={`w-32 h-32 rounded-[2rem] flex items-center justify-center mb-8 relative transition-all duration-500 ${
              status === 'granted' 
                ? 'bg-background shadow-neu-inset text-emerald-500' 
                : status === 'denied'
                ? 'bg-background shadow-neu-inset text-red-500'
                : 'bg-background shadow-neu text-purple-500'
            }`}>
              {status === 'granted' && <div className="absolute inset-0 bg-emerald-500/10 rounded-[2rem] blur-xl" />}
              {status === 'denied' && <div className="absolute inset-0 bg-red-500/10 rounded-[2rem] blur-xl" />}
              {status === 'default' && <div className="absolute inset-0 bg-purple-500/10 rounded-[2rem] blur-xl animate-pulse" />}
              
              {status === 'granted' ? (
                <CheckCircle2 size={48} className="relative z-10" />
              ) : (
                <Bell size={48} className={`relative z-10 ${status === 'default' ? 'animate-bounce' : ''}`} />
              )}
            </div>
            
            <h2 className="text-2xl font-black text-foreground tracking-tight mb-4">Never Miss Your Turn</h2>
            <p className="text-sm font-semibold text-muted-foreground leading-relaxed max-w-xs mb-8">
              Get instant alerts on your lock screen and audio chimes the moment your token is called by the teller.
            </p>

            <button
              onClick={requestNotification}
              disabled={status === 'granted'}
              className={`w-full h-16 rounded-2xl text-sm uppercase font-black tracking-widest flex items-center justify-center transition-all border-0 ${
                status === 'granted' 
                  ? 'bg-background shadow-neu-inset text-emerald-500 opacity-70 cursor-not-allowed'
                  : 'bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset text-purple-500'
              }`}
            >
              {status === 'granted' ? 'Permissions Active' : 'Enable Push Notifications'}
            </button>
            
            {status === 'denied' && (
              <p className="text-xs font-bold text-red-500 mt-6 px-4">
                Blocked in browser settings. Please click the lock icon in your URL bar to unblock.
              </p>
            )}
          </div>

          <div className="flex justify-center">
            <Link href="/citizen/settings">
              <button className="h-12 px-8 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-full text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all border-0">
                Maybe Later
              </button>
            </Link>
          </div>
        </div>

        {/* Right Column: Rationale Features */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-8 sm:p-10 border-0">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center mb-8">
              <Volume2 size={14} className="text-purple-500 mr-2" />
              Why We Request Access
            </h3>

            <div className="space-y-4">
              
              <div className="bg-background shadow-neu-inset hover:shadow-neu transition-all p-6 rounded-3xl flex items-start gap-5 border-0 group">
                <div className="w-12 h-12 rounded-xl bg-background shadow-neu flex items-center justify-center text-amber-500 shrink-0 transition-transform group-hover:-translate-y-1">
                  <Volume2 size={20} />
                </div>
                <div className="pt-1">
                  <h4 className="font-black text-base text-foreground mb-1">Live Counter Call Chime</h4>
                  <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                    Play an audible alert the moment teller staff announces your token to avoid missing your 5-minute reporting window.
                  </p>
                </div>
              </div>

              <div className="bg-background shadow-neu-inset hover:shadow-neu transition-all p-6 rounded-3xl flex items-start gap-5 border-0 group">
                <div className="w-12 h-12 rounded-xl bg-background shadow-neu flex items-center justify-center text-blue-500 shrink-0 transition-transform group-hover:-translate-y-1">
                  <Clock size={20} />
                </div>
                <div className="pt-1">
                  <h4 className="font-black text-base text-foreground mb-1">Smart Departure Nudge</h4>
                  <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                    Receive proactive reminders like &ldquo;Leave in 10 minutes to arrive in time for your turn&rdquo; directly on your lock screen.
                  </p>
                </div>
              </div>

              <div className="bg-background shadow-neu-inset hover:shadow-neu transition-all p-6 rounded-3xl flex items-start gap-5 border-0 group">
                <div className="w-12 h-12 rounded-xl bg-background shadow-neu flex items-center justify-center text-emerald-500 shrink-0 transition-transform group-hover:-translate-y-1">
                  <ShieldCheck size={20} />
                </div>
                <div className="pt-1">
                  <h4 className="font-black text-base text-foreground mb-1">Zero Spam Policy</h4>
                  <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                    You will only receive notifications strictly concerning your active token lifecycle. No marketing or promotions.
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
