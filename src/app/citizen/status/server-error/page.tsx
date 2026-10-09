"use client";

import Link from 'next/link';
import { 
  ServerCrash, RefreshCw, ArrowLeft, ShieldAlert, 
  HelpCircle, ArrowRight, Activity 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ServerErrorStatusPage() {
  const incidentId = "ERR-500-SRV-90184";

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-8 text-center">
      {/* 500 Graphic */}
      <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-lg ring-8 ring-red-400/20">
        <ServerCrash size={50} className="text-red-600" />
      </div>

      <div>
<h1 className="text-2xl font-black text-slate-900 mt-2">Server Encountered an Error</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          Our backend queue services encountered an unexpected hiccup. Our engineering team has been automatically dispatched.
        </p>
      </div>

      {/* Incident Box */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 text-left space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Incident Code:</span>
          <span className="font-mono font-bold text-slate-800">{incidentId}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Database Cluster:</span>
          <span className="text-emerald-600 font-semibold flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span> Safe & Retained
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <Button
          onClick={() => window.location.reload()}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold shadow-md"
        >
          <RefreshCw size={16} className="mr-2" /> Reload Page
        </Button>
        <Link href="/citizen/help/contact" className="block w-full">
          <Button variant="outline" className="w-full h-12 text-xs font-semibold border-slate-300">
            Report This Incident to Support
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
