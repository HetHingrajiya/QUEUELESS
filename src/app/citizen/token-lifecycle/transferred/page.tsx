"use client";

import Link from 'next/link';
import { 
  ArrowRightLeft, ArrowRight, MapPin, User, 
  ShieldCheck, Clock, CheckCircle2, Building2 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TokenTransferredPage() {
  const transferData = {
    tokenNumber: "A-145",
    serviceName: "Driving Licence Renewal",
    fromCounter: "Counter 4 (Initial Scan)",
    toCounter: "Counter 7 (Senior Verification Desk)",
    transferredBy: "Officer Rajesh Sharma",
    reason: "Specialized Medical Fitness Certificate Verification Required",
    priorityStatus: "PRIORITY RETAINED (1st in line)",
    location: "2nd Floor, Room 208, West Wing",
    timestamp: "Today, 10:42 AM"
  };

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-4 text-center">
      {/* Transfer Animated Graphic */}
      <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shadow-lg mx-auto ring-8 ring-indigo-400/20">
        <ArrowRightLeft size={48} className="text-indigo-600 animate-pulse" />
      </div>

      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
          Screen 31 • Token Lifecycle
        </span>
        <h1 className="text-2xl font-black text-slate-900 mt-2">Token Transferred</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          Your file has been forwarded to a specialized counter for final verification.
        </p>
      </div>

      {/* Transfer Routing Box */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-700 via-blue-700 to-slate-900 text-white shadow-xl overflow-hidden text-left">
        <CardContent className="p-6">
          <p className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">TRANSFER ASSIGNMENT</p>
          <div className="my-3 flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-xs text-indigo-200">Originated From</p>
              <p className="text-sm font-semibold">{transferData.fromCounter}</p>
            </div>
            <ArrowRight size={20} className="text-indigo-300" />
            <div className="text-right">
              <p className="text-xs text-emerald-300 font-bold">New Destination</p>
              <p className="text-lg font-black text-white">{transferData.toCounter}</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-indigo-100 pt-1">
            <div className="flex justify-between">
              <span className="text-indigo-300">Reason:</span>
              <span className="font-medium text-white text-right max-w-[200px]">{transferData.reason}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-indigo-300">Queue Priority:</span>
              <span className="font-bold text-amber-300">{transferData.priorityStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-indigo-300">Transferred By:</span>
              <span className="text-white">{transferData.transferredBy}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Directions to New Counter */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm space-y-1.5">
        <div className="flex items-center text-xs font-bold text-slate-800 uppercase tracking-wide">
          <MapPin size={16} className="text-blue-600 mr-2" />
          Where to Go Now
        </div>
        <p className="text-xs text-slate-600">
          Please proceed to <strong>{transferData.location}</strong>. Your original token <strong>A-145</strong> will be called on the display screen immediately.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <Link href="/citizen/token-lifecycle/serving" className="block w-full">
          <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold shadow-md">
            I Have Reached Counter 7 <ArrowRight size={16} className="ml-2" />
          </Button>
        </Link>
        <Link href="/citizen/queue" className="block w-full">
          <Button variant="ghost" className="w-full text-xs text-slate-500">
            View Live Queue
          </Button>
        </Link>
      </div>
    </div>
  );
}
