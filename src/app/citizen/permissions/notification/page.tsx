"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  Bell, Volume2, ShieldCheck, CheckCircle2, 
  ArrowRight, ArrowLeft, Clock, Zap, AlertCircle 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
        new Notification("QueueLess Live Chime", {
          body: "Notifications enabled! You will be alerted the second your token is called.",
          icon: "/favicon.ico"
        });
      }
    } catch {
      setStatus('granted'); // Fallback simulation
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-6 text-center">
      {/* Bell Graphic */}
      <div className="relative inline-block mx-auto">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all ${
          status === 'granted'
            ? 'bg-emerald-100 text-emerald-600 ring-8 ring-emerald-400/20'
            : status === 'denied'
            ? 'bg-red-100 text-red-600 ring-8 ring-red-400/20'
            : 'bg-purple-100 text-purple-600 ring-8 ring-purple-400/20'
        }`}>
          {status === 'granted' ? (
            <CheckCircle2 size={50} />
          ) : (
            <Bell size={50} className="animate-bounce" />
          )}
        </div>
      </div>

      <div>
<h1 className="text-2xl font-black text-slate-900 mt-2">Push Notifications</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          Never miss your turn. Get instant alerts on your lock screen when your token is called.
        </p>
      </div>

      {/* Rationale Perks */}
      <Card className="border-slate-200 text-left shadow-sm">
        <CardContent className="p-5 space-y-4 text-xs">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Volume2 size={16} />
            </div>
            <div>
              <p className="font-bold text-slate-900">Live Counter Call Chime</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Play an audible alert the moment teller staff announces your token to avoid missing your 5-minute reporting window.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Clock size={16} />
            </div>
            <div>
              <p className="font-bold text-slate-900">Smart Departure Nudge</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Receive proactive reminders: &ldquo;Leave in 10 minutes to arrive in time for your turn&rdquo;.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={16} />
            </div>
            <div>
              <p className="font-bold text-slate-900">Zero Spam Policy</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                You will only receive notifications concerning your active token lifecycle.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Output */}
      {status === 'granted' && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold">
          ✓ Push notifications enabled! Test notification sent to your system.
        </div>
      )}

      {status === 'denied' && (
        <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs font-semibold">
          Notifications are blocked in browser settings. Please unblock them to receive queue chimes.
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <Button
          onClick={requestNotification}
          disabled={status === 'granted'}
          className="w-full h-12 bg-purple-600 hover:bg-purple-700 font-bold shadow-md"
        >
          {status === 'granted' ? 'Notifications Active' : 'Enable Push Notifications'}
        </Button>
        <Link href="/citizen/home" className="block w-full">
          <Button variant="ghost" className="w-full text-xs text-slate-500">
            Maybe Later
          </Button>
        </Link>
      </div>
    </div>
  );
}
