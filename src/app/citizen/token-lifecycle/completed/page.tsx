"use client";

import Link from 'next/link';
import { 
  CheckCircle2, Download, Star, ArrowRight, 
  FileText, Calendar, Building2, ShieldCheck, Heart 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ServiceCompletedPage() {
  const receipt = {
    tokenNumber: "A-145",
    serviceName: "Driving Licence Renewal",
    officeName: "Regional Transport Office (RTO)",
    completedAt: "Oct 8, 2026, 10:48 AM",
    duration: "7 mins 30 sec",
    counterOfficer: "Officer Rajesh Sharma (Counter 4)",
    transactionRef: "QL-TXN-2026-98174",
    status: "SUCCESSFULLY FULFILLED"
  };

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-4 text-center">
      {/* Success Badge */}
      <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-lg mx-auto ring-8 ring-emerald-400/20">
        <CheckCircle2 size={54} className="text-emerald-600" />
      </div>

      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Screen 28 • Token Lifecycle
        </span>
        <h1 className="text-2xl font-black text-slate-900 mt-2">Service Completed!</h1>
        <p className="text-xs text-slate-500 mt-1">
          Your request has been successfully processed and verified.
        </p>
      </div>

      {/* Completion E-Receipt Card */}
      <Card className="border-slate-200 bg-white shadow-md text-left overflow-hidden">
        <div className="bg-emerald-600 h-2 w-full"></div>
        <CardContent className="p-6">
          <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">OFFICIAL E-RECEIPT</p>
              <h3 className="text-2xl font-black text-slate-900">{receipt.tokenNumber}</h3>
              <p className="text-xs font-semibold text-slate-700">{receipt.serviceName}</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
              Fulfilled
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Office:</span>
              <span className="font-semibold text-slate-800 text-right">{receipt.officeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Officer:</span>
              <span className="font-medium text-slate-800">{receipt.counterOfficer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Completion Time:</span>
              <span className="font-medium text-slate-800">{receipt.completedAt}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Service Duration:</span>
              <span className="font-bold text-emerald-700">{receipt.duration}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-400">Reference ID:</span>
              <span className="font-mono text-slate-600">{receipt.transactionRef}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Prompt Banner */}
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 text-left shadow-xs">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-amber-400 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Star size={20} className="fill-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">How was your service?</p>
              <p className="text-[11px] text-slate-500">Rate officer courtesy and wait experience</p>
            </div>
          </div>
          <Link href="/citizen/feedback/rating">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs">
              Rate Now
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <Button 
          variant="outline" 
          onClick={() => alert("E-Receipt downloaded successfully as PDF.")}
          className="w-full h-12 border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
        >
          <Download size={16} className="mr-2" /> Download Acknowledgment Receipt
        </Button>
        <Link href="/citizen/home" className="block w-full">
          <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold shadow-md">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
