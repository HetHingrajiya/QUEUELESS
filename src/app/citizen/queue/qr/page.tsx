"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, QrCode, Download, Share2, ShieldCheck, 
  MapPin, Clock, Calendar, Building2, Smartphone, CheckCircle2 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DigitalTokenQRPage() {
  const router = useRouter();
  const [downloaded, setDownloaded] = useState(false);

  const tokenData = {
    tokenNumber: "A-145",
    serviceName: "Driving Licence Renewal",
    officeName: "Regional Transport Office (RTO)",
    address: "Civil Center, Ring Road, Rajkot",
    citizenName: "Heth Hingrajiya",
    date: "Today, Oct 8, 2026",
    timeGenerated: "10:15 AM",
    status: "ACTIVE QUEUE",
    counterNumber: "Counter 4 (Assigned)",
    securityHash: "QL-99482-SECURE"
  };

  const handleDownload = () => {
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Link href="/citizen/queue" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Screen 18 • Live Queue
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">Digital Token Pass & QR</h1>
          </div>
        </div>
      </div>

      {/* Main Digital Board Ticket */}
      <div className="relative">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Header Strip */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center relative">
            <div className="inline-flex items-center space-x-1.5 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-white/20">
              <ShieldCheck size={14} className="text-emerald-300" />
              <span>Official Digital Queue Pass</span>
            </div>
            <p className="text-xs uppercase tracking-widest text-blue-100 font-semibold">TOKEN NUMBER</p>
            <h2 className="text-5xl font-black tracking-tight my-1">{tokenData.tokenNumber}</h2>
            <p className="text-xs text-blue-100 font-medium">{tokenData.serviceName}</p>
          </div>

          {/* Ticket Body with Notches */}
          <div className="p-6 relative">
            {/* Left & Right Cutout Notches */}
            <div className="absolute -left-3 top-[-12px] w-6 h-6 bg-slate-50 rounded-full border-r border-slate-200"></div>
            <div className="absolute -right-3 top-[-12px] w-6 h-6 bg-slate-50 rounded-full border-l border-slate-200"></div>

            {/* QR Code Container */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col items-center justify-center my-2 shadow-inner">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <QrCode size={160} className="text-slate-900" />
              </div>
              <p className="text-[11px] font-mono text-slate-500 mt-3 tracking-widest uppercase">
                {tokenData.securityHash}
              </p>
              <p className="text-xs text-slate-500 mt-1 text-center font-medium">
                Hold under scanner at reception kiosk to fast check-in
              </p>
            </div>

            {/* Details Table */}
            <div className="space-y-3 pt-4 border-t border-dashed border-slate-200 mt-4 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Citizen Name</span>
                <span className="font-bold text-slate-800">{tokenData.citizenName}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Office Location</span>
                <span className="font-semibold text-slate-800 text-right">{tokenData.officeName}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Issue Date & Time</span>
                <span className="font-medium text-slate-700">{tokenData.date} • {tokenData.timeGenerated}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Queue Stage</span>
                <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {tokenData.status}
                </span>
              </div>
            </div>

            {/* Barcode Simulator */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col items-center">
              <div className="flex space-x-1 h-8 items-center opacity-70">
                {[4, 2, 6, 2, 8, 3, 5, 2, 7, 3, 5, 2, 4, 6, 2, 8, 3, 4].map((w, idx) => (
                  <div key={idx} className="bg-slate-900 h-full" style={{ width: `${w * 1.5}px` }}></div>
                ))}
              </div>
              <span className="text-[10px] font-mono text-slate-400 mt-1">4819 0281 9283 1029</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          onClick={handleDownload}
          variant="outline" 
          className="h-12 border-slate-300 font-semibold text-slate-700 hover:bg-slate-100 shadow-sm"
        >
          {downloaded ? (
            <>
              <CheckCircle2 size={16} className="mr-2 text-emerald-600" /> Pass Saved!
            </>
          ) : (
            <>
              <Download size={16} className="mr-2 text-slate-600" /> Save Pass (PDF)
            </>
          )}
        </Button>
        <Link href="/citizen/queue" className="block">
          <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-semibold shadow-md">
            View Live Queue
          </Button>
        </Link>
      </div>

      {/* Fast Check-In Shortcut */}
      <Card className="border-blue-100 bg-blue-50/50">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Smartphone size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Arrived at the Office?</p>
              <p className="text-[11px] text-slate-500">Scan reception QR code to check in immediately</p>
            </div>
          </div>
          <Link href="/citizen/check-in">
            <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-xs">
              Check-In
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
