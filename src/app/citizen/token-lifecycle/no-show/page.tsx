"use client";

import Link from 'next/link';
import { 
  AlertTriangle, Clock, RefreshCw, ArrowRight, 
  ShieldAlert, HelpCircle, FileText 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TokenNoShowPage() {
  const noShowData = {
    tokenNumber: "A-145",
    serviceName: "Driving Licence Renewal",
    officeName: "Regional Transport Office (RTO)",
    calledAt: "10:25 AM",
    expiredAt: "10:31 AM (6 mins elapsed)",
    counterNumber: "Counter 4",
    penaltyStatus: "None (1st Occurrence)"
  };

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-6 text-center">
      {/* Alert Warning Graphic */}
      <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shadow-lg mx-auto ring-8 ring-amber-400/20">
        <AlertTriangle size={54} className="text-amber-600" />
      </div>

      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          Screen 30 • Token Lifecycle
        </span>
        <h1 className="text-2xl font-black text-slate-900 mt-2">Token Marked as No-Show</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          The 5-minute reporting grace period expired before you reported to Counter 4.
        </p>
      </div>

      {/* Details Card */}
      <Card className="border-amber-200 bg-white shadow-md text-left overflow-hidden">
        <div className="bg-amber-500 h-2 w-full"></div>
        <CardContent className="p-6">
          <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">MISSED TOKEN</p>
              <h3 className="text-3xl font-black text-slate-700">{noShowData.tokenNumber}</h3>
              <p className="text-xs font-semibold text-slate-600">{noShowData.serviceName}</p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 uppercase">
              No Show
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Office:</span>
              <span className="font-semibold text-slate-800">{noShowData.officeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">First Called:</span>
              <span className="font-medium text-slate-800">{noShowData.calledAt}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Grace Expired:</span>
              <span className="font-medium text-red-600">{noShowData.expiredAt}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-400">Queue Policy Status:</span>
              <span className="font-bold text-emerald-700">{noShowData.penaltyStatus}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policy Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs text-slate-600 space-y-1">
        <p className="font-bold text-slate-800 flex items-center">
          <HelpCircle size={15} className="mr-1.5 text-blue-600 shrink-0" />
          Queue Fairness Policy
        </p>
        <p className="text-[11px] leading-relaxed">
          To minimize waiting times for all citizens, tokens are automatically passed if not attended. You can immediately generate a new virtual token without penalty.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <Link href="/citizen/token" className="block w-full">
          <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold shadow-md">
            <RefreshCw size={16} className="mr-2" /> Request New Token Now
          </Button>
        </Link>
        <Link href="/citizen/help" className="block w-full">
          <Button variant="ghost" className="w-full text-xs text-slate-500">
            Contact Support / Appeal
          </Button>
        </Link>
      </div>
    </div>
  );
}
