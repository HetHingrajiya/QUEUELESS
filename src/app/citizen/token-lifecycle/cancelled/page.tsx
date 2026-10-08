"use client";

import Link from 'next/link';
import { 
  XCircle, ArrowRight, RefreshCw, Calendar, 
  Building2, AlertCircle, ShieldCheck, Ticket 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TokenCancelledPage() {
  const cancelData = {
    tokenNumber: "A-145",
    serviceName: "Driving Licence Renewal",
    officeName: "Regional Transport Office (RTO)",
    cancelledAt: "Today, 10:35 AM",
    cancellationReason: "Citizen voluntary cancellation (Change of schedule)",
    cancellationRef: "CAN-2026-88190"
  };

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-6 text-center">
      {/* Cancellation Icon Graphic */}
      <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-lg mx-auto ring-8 ring-red-400/20">
        <XCircle size={56} className="text-red-600" />
      </div>

      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-red-800 bg-red-50 px-3 py-1 rounded-full border border-red-200">
          Screen 29 • Token Lifecycle
        </span>
        <h1 className="text-2xl font-black text-slate-900 mt-2">Token Cancelled</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          Your virtual queue ticket has been cancelled and your position in line released.
        </p>
      </div>

      {/* Cancellation Details Card */}
      <Card className="border-red-200 bg-white shadow-md text-left overflow-hidden">
        <div className="bg-red-500 h-2 w-full"></div>
        <CardContent className="p-6">
          <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">CANCELLED TICKET</p>
              <h3 className="text-3xl font-black text-slate-400 line-through">{cancelData.tokenNumber}</h3>
              <p className="text-xs font-semibold text-slate-700">{cancelData.serviceName}</p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-800 uppercase">
              Cancelled
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Office:</span>
              <span className="font-semibold text-slate-800">{cancelData.officeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Timestamp:</span>
              <span className="font-medium text-slate-800">{cancelData.cancelledAt}</span>
            </div>
            <div className="flex flex-col pt-1">
              <span className="text-slate-400 mb-0.5">Reason:</span>
              <span className="font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                {cancelData.cancellationReason}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-400">Cancellation Ref:</span>
              <span className="font-mono text-slate-500">{cancelData.cancellationRef}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rebook Token CTA */}
      <div className="space-y-2 pt-2">
        <Link href="/citizen/token" className="block w-full">
          <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold shadow-md">
            <RefreshCw size={16} className="mr-2" /> Book Another Virtual Token
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
