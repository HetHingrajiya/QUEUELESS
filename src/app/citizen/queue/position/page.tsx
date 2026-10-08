"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Users, Clock, CheckCircle2, 
  ArrowRight, Activity, Sparkles, User, ShieldAlert 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function QueuePositionPage() {
  const [activeToken] = useState({
    tokenNumber: "A-145",
    serviceName: "Driving Licence Renewal",
    officeName: "Regional Transport Office (RTO)",
    position: 4,
    totalInQueue: 18,
    servingToken: "A-141",
    counterNumber: "Counter 4",
    estTime: "12 mins"
  });

  const queueLine = [
    { number: "A-141", status: "SERVING", counter: "Counter 4", isMe: false, time: "Now" },
    { number: "A-142", status: "NEXT", counter: "Up Next", isMe: false, time: "~3 min" },
    { number: "A-143", status: "WAITING", counter: "In Queue", isMe: false, time: "~6 min" },
    { number: "A-144", status: "WAITING", counter: "In Queue", isMe: false, time: "~9 min" },
    { number: "A-145", status: "YOUR TURN SOON", counter: "Counter 4 (Assigned)", isMe: true, time: "~12 min" },
    { number: "A-146", status: "WAITING", counter: "Behind You", isMe: false, time: "~15 min" },
    { number: "A-147", status: "WAITING", counter: "Behind You", isMe: false, time: "~18 min" },
  ];

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
              Screen 21 • Live Queue
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">Queue Position & Line</h1>
          </div>
        </div>
      </div>

      {/* Position Hero Card */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg overflow-hidden">
        <CardContent className="p-6 text-center">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-3 border border-white/20">
            Your Virtual Place
          </span>
          <div className="flex items-baseline justify-center space-x-2">
            <span className="text-6xl font-black tracking-tight"># {activeToken.position}</span>
            <span className="text-blue-200 font-medium text-sm">in line</span>
          </div>
          <p className="text-xs text-blue-100 mt-2">
            Token <strong className="text-white">{activeToken.tokenNumber}</strong> for {activeToken.serviceName}
          </p>

          <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-white/20 text-left">
            <div>
              <p className="text-[11px] text-blue-200">Current Serving</p>
              <p className="text-lg font-bold">{activeToken.servingToken}</p>
            </div>
            <div>
              <p className="text-[11px] text-blue-200">Estimated Turn</p>
              <p className="text-lg font-bold text-amber-300">{activeToken.estTime}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual Live Queue Line */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center">
            <Activity size={16} className="text-blue-600 mr-2" />
            Live Queue Sequence
          </h3>
          <span className="text-xs font-medium text-slate-400">
            {activeToken.totalInQueue} tokens total
          </span>
        </div>

        <div className="space-y-2.5">
          {queueLine.map((item, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                item.isMe
                  ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/20 shadow-md'
                  : item.status === 'SERVING'
                  ? 'bg-amber-50/70 border-amber-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    item.isMe
                      ? 'bg-blue-600 text-white shadow-xs'
                      : item.status === 'SERVING'
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {idx + 1}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-slate-900 text-base">{item.number}</span>
                    {item.isMe && (
                      <span className="bg-blue-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        YOU
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.counter}</p>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider block mb-1 ${
                    item.status === 'SERVING'
                      ? 'bg-amber-100 text-amber-800'
                      : item.isMe
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.status}
                </span>
                <span className="text-xs text-slate-400 font-medium">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Quick Links */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link href="/citizen/queue/prediction">
          <Button variant="outline" className="w-full text-xs font-semibold border-slate-200">
            <Sparkles size={14} className="mr-1.5 text-purple-600" /> AI Prediction
          </Button>
        </Link>
        <Link href="/citizen/queue/leave-time">
          <Button variant="outline" className="w-full text-xs font-semibold border-slate-200">
            <Clock size={14} className="mr-1.5 text-blue-600" /> Leave Time
          </Button>
        </Link>
      </div>
    </div>
  );
}
