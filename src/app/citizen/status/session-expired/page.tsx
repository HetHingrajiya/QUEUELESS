"use client";

import Link from 'next/link';
import { 
  Hourglass, LogIn, ArrowRight, ShieldCheck, 
  RefreshCw, Clock 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SessionExpiredStatusPage() {
  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-8 text-center">
      {/* Hourglass Graphic */}
      <div className="w-24 h-24 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg ring-8 ring-purple-400/20">
        <Hourglass size={48} className="text-purple-600 animate-pulse" />
      </div>

      <div>
<h1 className="text-2xl font-black text-slate-900 mt-2">Session Expired</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          For your data security, your active login session has timed out after a period of inactivity.
        </p>
      </div>

      {/* Security Info Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 text-left space-y-1">
        <p className="font-bold text-slate-800 flex items-center">
          <ShieldCheck size={15} className="mr-1.5 text-emerald-600 shrink-0" />
          Queue State Preserved
        </p>
        <p className="text-[11px] leading-relaxed">
          Don&apos;t worry: your active virtual token in the queue has <strong>not</strong> been cancelled. Re-signing in will restore your real-time tracking dashboard immediately.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <Link href="/login" className="block w-full">
          <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold shadow-md">
            <LogIn size={16} className="mr-2" /> Log Back In Now
          </Button>
        </Link>
        <Link href="/citizen/home" className="block w-full">
          <Button variant="ghost" className="w-full text-xs text-slate-500">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
