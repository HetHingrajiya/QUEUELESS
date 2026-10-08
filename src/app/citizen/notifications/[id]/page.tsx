"use client";

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Bell, Calendar, Clock, 
  ArrowRight, ShieldCheck, Volume2, Info, CheckCircle2 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NotificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const details = {
    id: id || "notif-1",
    title: "Your Token Has Been Called to Counter 4",
    body: "Your virtual token A-145 for Driving Licence Renewal has been called by Officer Rajesh Sharma at Counter 4. Please proceed immediately to the assigned counter room on the 1st floor.",
    time: "Oct 8, 2026 at 10:33 AM",
    sender: "Regional Transport Office (RTO Rajkot)",
    priority: "HIGH PRIORITY",
    actionUrl: "/citizen/token-lifecycle/called",
    actionLabel: "View Live Token Called Screen"
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
              Screen 37 • Notifications
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">Notification Details</h1>
          </div>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md shrink-0">
            <Volume2 size={24} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
              {details.priority}
            </span>
            <h3 className="font-bold text-base mt-1 line-clamp-1">{details.title}</h3>
          </div>
        </div>

        <CardContent className="p-6 space-y-4 text-xs">
          <div className="flex justify-between items-center text-slate-400 border-b border-slate-100 pb-3">
            <span>Received:</span>
            <span className="font-medium text-slate-700">{details.time}</span>
          </div>

          <div className="flex justify-between items-center text-slate-400 border-b border-slate-100 pb-3">
            <span>Originating Authority:</span>
            <span className="font-bold text-slate-800">{details.sender}</span>
          </div>

          <div className="py-2">
            <p className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider mb-1.5">
              Notification Message
            </p>
            <p className="text-slate-800 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {details.body}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CTA Button */}
      <div className="space-y-2">
        <Link href={details.actionUrl} className="block w-full">
          <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold shadow-md">
            {details.actionLabel} <ArrowRight size={16} className="ml-2" />
          </Button>
        </Link>
        <Link href="/citizen/notifications" className="block w-full">
          <Button variant="ghost" className="w-full text-xs text-slate-500">
            Back to All Notifications
          </Button>
        </Link>
      </div>
    </div>
  );
}
