"use client";

import Link from 'next/link';
import { 
  ArrowLeft, Layers, ShieldCheck, Cpu, 
  Globe, Heart, Sparkles, CheckCircle2 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AboutQueueLessPage() {
  const features = [
    { title: "Virtual Token Booking", desc: "Book queue slots remotely from anywhere without standing in physical lines." },
    { title: "AI-Powered Wait Estimation", desc: "Machine learning models dynamically calculate wait time using live teller velocity." },
    { title: "Smart Mobility & Departure Alerts", desc: "Know the exact minute to leave home or office to arrive right when called." },
    { title: "Zero Paper Digital Pass", desc: "Secure encrypted QR codes with automated kiosk and geofence check-ins." }
  ];

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-2 text-center">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Link href="/citizen/profile" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <div className="text-left">
<h1 className="text-xl font-bold text-slate-900 mt-0.5">About QueueLess</h1>
          </div>
        </div>
      </div>

      {/* Brand Hero */}
      <div className="py-4">
        <div className="w-16 h-16 bg-blue-600 rounded-3xl text-white flex items-center justify-center mx-auto shadow-xl ring-8 ring-blue-50 mb-3">
          <Layers size={32} />
        </div>
        <h2 className="text-2xl font-black text-slate-900">QueueLess</h2>
        <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mt-0.5">Version 2.4.0 (Enterprise)</p>
        <p className="text-xs text-slate-500 max-w-xs mx-auto mt-2 leading-relaxed">
          The next-generation civic queue management platform transforming citizen engagement across public offices.
        </p>
      </div>

      {/* Pillars */}
      <Card className="border-slate-200 text-left shadow-sm">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center">
            <Sparkles size={14} className="text-blue-600 mr-2" />
            Core Technological Innovations
          </h3>

          <div className="space-y-3">
            {features.map((item, idx) => (
              <div key={idx} className="flex items-start space-x-3 text-xs">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800">{item.title}</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5 leading-snug">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Badge */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 text-left flex items-start space-x-3">
        <ShieldCheck size={20} className="text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-800">GovTech Compliance & Data Privacy</p>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
            All token transactions and citizen identifiers are secured via 256-bit encryption and adhere to national digital personal data protection standards.
          </p>
        </div>
      </div>

      <div className="text-[11px] text-slate-400 space-x-4">
        <span>© 2026 QueueLess GovTech</span>
        <span>•</span>
        <Link href="/citizen/help" className="hover:underline text-slate-600">Help & FAQs</Link>
        <span>•</span>
        <Link href="/citizen/settings/privacy" className="hover:underline text-slate-600">Privacy Policy</Link>
      </div>
    </div>
  );
}
