"use client";

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, Clock, Building2, User, 
  Download, CheckCircle2, Ticket, ShieldCheck, Star, FileText 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TokenHistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const tokenDetail = {
    id: id || "tok-1092",
    tokenNumber: "A-145",
    serviceName: "Driving Licence Renewal",
    officeName: "Regional Transport Office (RTO Rajkot)",
    officeAddress: "Ring Road, Sector 12, Civil Center",
    date: "October 4, 2026",
    status: "COMPLETED",
    totalWaitTime: "18 minutes",
    serviceDuration: "7 minutes",
    officerName: "Rajesh Sharma",
    counterNumber: "Counter 4",
    transactionId: "QL-HIST-99214-REC",
    ratingGiven: 5,
    timeline: [
      { event: "Virtual Token Generated", time: "10:15 AM", status: "Done" },
      { event: "Arrival & Geofence Check-In", time: "10:28 AM", status: "Done" },
      { event: "Token Called to Counter 4", time: "10:33 AM", status: "Done" },
      { event: "Service Processing Completed", time: "10:41 AM", status: "Done" },
    ]
  };

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <button 
            onClick={() => router.back()} 
            className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Screen 33 • History
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">Visit Details</h1>
          </div>
        </div>
      </div>

      {/* Main Ticket Summary Card */}
      <Card className="border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200">HISTORICAL TOKEN</p>
              <h2 className="text-4xl font-black mt-0.5">{tokenDetail.tokenNumber}</h2>
              <p className="text-xs text-blue-100 mt-1 font-medium">{tokenDetail.serviceName}</p>
            </div>
            <span className="bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase">
              {tokenDetail.status}
            </span>
          </div>
        </div>

        <CardContent className="p-5 space-y-4 text-xs">
          <div className="space-y-2 pb-3 border-b border-slate-100">
            <div className="flex justify-between">
              <span className="text-slate-400">Office Branch:</span>
              <span className="font-bold text-slate-800 text-right">{tokenDetail.officeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Date of Visit:</span>
              <span className="font-medium text-slate-800">{tokenDetail.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Counter Officer:</span>
              <span className="font-medium text-slate-800">{tokenDetail.officerName} ({tokenDetail.counterNumber})</span>
            </div>
          </div>

          {/* Time Metrics */}
          <div className="grid grid-cols-2 gap-3 py-1">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Queue Wait</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">{tokenDetail.totalWaitTime}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Service Time</p>
              <p className="text-base font-bold text-emerald-600 mt-0.5">{tokenDetail.serviceDuration}</p>
            </div>
          </div>

          {/* Timeline Audit */}
          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Visit Milestone Timeline
            </h4>
            <div className="space-y-3 relative pl-4 border-l-2 border-blue-200 ml-2">
              {tokenDetail.timeline.map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800 text-xs">{step.event}</span>
                    <span className="text-slate-400 text-[11px] font-mono">{step.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Citizen Rating Display */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-slate-500">Your Rating:</span>
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className="fill-amber-400" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button 
          variant="outline"
          onClick={() => alert("Downloading official PDF visit transcript...")}
          className="w-full h-12 border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Download size={16} className="mr-2" /> Download Visit Receipt (PDF)
        </Button>
        <Link href="/citizen/token" className="block w-full">
          <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold shadow-md">
            Book Similar Service Again
          </Button>
        </Link>
      </div>
    </div>
  );
}
