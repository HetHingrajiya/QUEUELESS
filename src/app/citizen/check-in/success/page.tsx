"use client";

import Link from 'next/link';
import { 
  CheckCircle2, Building2, MapPin, ArrowRight, 
  Bell, Smartphone, Clock, ShieldCheck, Ticket, Users 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CheckInSuccessPage() {
  const checkInData = {
    tokenNumber: "A-145",
    serviceName: "Driving Licence Renewal",
    officeName: "Regional Transport Office (RTO)",
    hallLocation: "Waiting Hall B • 1st Floor",
    assignedCounter: "Counter 4",
    checkInTime: "10:24 AM",
    peopleAhead: 3,
    approxWait: "9 minutes"
  };

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-6 text-center">
      {/* Success Animated Graphic */}
      <div className="relative inline-block mx-auto">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-50 duration-500">
          <CheckCircle2 size={56} className="text-emerald-600" />
        </div>
        <div className="absolute -top-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full shadow-sm">
          <ShieldCheck size={16} />
        </div>
      </div>

      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Screen 25 • Check-In Complete
        </span>
        <h1 className="text-2xl font-black text-slate-900 mt-2">You're Checked In!</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          The counter officers have been notified of your presence in the waiting area.
        </p>
      </div>

      {/* Verified Token Card */}
      <Card className="border-emerald-200 bg-gradient-to-br from-white to-emerald-50/40 shadow-md text-left overflow-hidden">
        <div className="bg-emerald-600 h-2 w-full"></div>
        <CardContent className="p-6">
          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">YOUR TOKEN</p>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">{checkInData.tokenNumber}</h2>
              <p className="text-xs font-semibold text-emerald-700 mt-0.5">{checkInData.serviceName}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                Checked In
              </span>
              <p className="text-xs text-slate-400 mt-2">{checkInData.checkInTime}</p>
            </div>
          </div>

          <div className="space-y-3 pt-4 text-xs">
            <div className="flex items-center text-slate-700">
              <MapPin size={15} className="mr-2.5 text-blue-600 shrink-0" />
              <span>Proceed to: <strong className="text-slate-900">{checkInData.hallLocation}</strong></span>
            </div>
            <div className="flex items-center text-slate-700">
              <Users size={15} className="mr-2.5 text-indigo-600 shrink-0" />
              <span>Only <strong className="text-slate-900">{checkInData.peopleAhead} people</strong> ahead of you now</span>
            </div>
            <div className="flex items-center text-slate-700">
              <Clock size={15} className="mr-2.5 text-amber-600 shrink-0" />
              <span>Estimated wait: <strong className="text-slate-900">{checkInData.approxWait}</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chime & Alert Instruction */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-left flex items-start space-x-3">
        <Bell size={20} className="text-blue-600 shrink-0 mt-0.5 animate-bounce" />
        <div className="text-xs">
          <p className="font-bold text-slate-900">Keep Your Phone Unmuted</p>
          <p className="text-slate-600 mt-0.5">
            You will receive a loud chime and push notification the moment your token is called to <strong>{checkInData.assignedCounter}</strong>.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <Link href="/citizen/queue" className="block w-full">
          <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold shadow-md">
            Watch Live Queue Display <ArrowRight size={16} className="ml-2" />
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
