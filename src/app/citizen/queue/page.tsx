"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Car, Clock, Navigation, CheckCircle2, Ticket } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function LiveQueue() {
  const [progress, setProgress] = useState(82);

  // In a real app, this would use Socket.IO to update real-time
  useEffect(() => {
    // Mock progress update
  }, []);

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Link href="/citizen/home" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Live Queue</h1>
        </div>
        <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-semibold flex items-center border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
          Live
        </div>
      </div>

      {/* When should I leave? Feature */}
      <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Car size={100} />
        </div>
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center space-x-2 text-blue-100 mb-4">
            <Navigation size={18} />
            <h2 className="font-medium text-sm tracking-wide uppercase">Smart Prediction</h2>
          </div>
          
          <p className="text-4xl font-bold mb-1">Leave in 5 min</p>
          <p className="text-blue-100 text-sm mb-6">to arrive on time for your turn.</p>

          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
            <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3 mb-3">
              <span className="text-blue-100">Queue Wait</span>
              <span className="font-semibold">18 min</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3 mb-3">
              <span className="text-blue-100">Travel Time</span>
              <span className="font-semibold">12 min</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-blue-100">Check-in Buffer</span>
              <span className="font-semibold">5 min</span>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-blue-200 uppercase tracking-wider mb-1">Recommended Departure</p>
            <p className="text-xl font-bold">10:25 AM</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-blue-200 shadow-blue-50 bg-blue-50/30">
          <CardContent className="p-5 text-center">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Your Token</p>
            <p className="text-4xl font-black text-slate-900">A-145</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-5 text-center flex flex-col justify-center h-full">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Current Token</p>
            <p className="text-3xl font-bold text-slate-700">A-138</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-sm font-medium text-slate-500">Queue Progress</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{progress}%</p>
          </div>
          <Progress value={progress} className="h-3 mb-6" />
          
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mr-3">
                <Ticket size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500">People Ahead</p>
                <p className="font-bold text-slate-900">7</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mr-3">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500">AI Est. Wait</p>
                <p className="font-bold text-slate-900">14 min</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-12">
        Cancel Token
      </Button>
    </div>
  );
}
