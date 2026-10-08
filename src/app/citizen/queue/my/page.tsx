"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Clock, Users, Building2, QrCode, 
  ArrowRight, AlertCircle, RefreshCw, CheckCircle2, Ticket 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function MyQueuePage() {
  const [activeQueues, setActiveQueues] = useState([
    {
      id: 'tok-1',
      tokenNumber: 'A-145',
      serviceName: 'Driving Licence Renewal',
      officeName: 'Regional Transport Office (RTO)',
      status: 'WAITING',
      peopleAhead: 6,
      estimatedWaitMin: 18,
      nowServing: 'A-139',
      counterNumber: 'Counter 4',
      date: 'Today, 10:15 AM'
    },
    {
      id: 'tok-2',
      tokenNumber: 'B-042',
      serviceName: 'Birth Certificate Verification',
      officeName: 'Rajkot Municipal Corporation HQ',
      status: 'CHECKED_IN',
      peopleAhead: 2,
      estimatedWaitMin: 7,
      nowServing: 'B-040',
      counterNumber: 'Counter 2',
      date: 'Today, 11:30 AM'
    }
  ]);

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Link href="/citizen/home" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Screen 19 • Live Queue
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">My Active Queues</h1>
          </div>
        </div>
        <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-xs">
          {activeQueues.length} Active
        </span>
      </div>

      <div className="space-y-4">
        {activeQueues.map((item) => (
          <Card key={item.id} className="border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className={`h-2 ${item.status === 'CHECKED_IN' ? 'bg-emerald-500' : 'bg-blue-600'}`}></div>
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    item.status === 'CHECKED_IN'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {item.status === 'CHECKED_IN' ? 'CHECKED IN (AT VENUE)' : 'WAITING IN LINE'}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base mt-1.5">{item.serviceName}</h3>
                  <p className="text-xs text-slate-500 flex items-center mt-0.5">
                    <Building2 size={13} className="mr-1 text-slate-400" />
                    {item.officeName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Token</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tight">{item.tokenNumber}</p>
                </div>
              </div>

              {/* Live Metric Badges */}
              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Users size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium">People Ahead</p>
                    <p className="text-lg font-bold text-slate-900">{item.peopleAhead}</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium">Est. Wait</p>
                    <p className="text-lg font-bold text-slate-900">{item.estimatedWaitMin}m</p>
                  </div>
                </div>
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between text-xs text-slate-500 py-2 border-t border-slate-100 mb-3">
                <span>Currently Serving: <strong className="text-slate-800">{item.nowServing}</strong></span>
                <span>{item.counterNumber}</span>
              </div>

              {/* CTA Buttons */}
              <div className="flex space-x-2">
                <Link href={`/citizen/queue/qr`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold border-slate-200">
                    <QrCode size={14} className="mr-1.5" /> View QR
                  </Button>
                </Link>
                <Link href={`/citizen/queue`} className="flex-1">
                  <Button size="sm" className="w-full text-xs font-semibold bg-blue-600 hover:bg-blue-700">
                    Track Live <ArrowRight size={14} className="ml-1.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Book New Token Action */}
      <div className="pt-2">
        <Link href="/citizen/token">
          <Button variant="outline" className="w-full h-12 border-dashed border-2 border-slate-300 text-slate-700 font-semibold hover:border-blue-400 hover:text-blue-600">
            + Take Another Virtual Token
          </Button>
        </Link>
      </div>
    </div>
  );
}
