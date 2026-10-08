"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, CheckCircle2, Calendar, Clock, 
  Building2, Ticket, Download, Star, ArrowRight 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CompletedServicesPage() {
  const [completedList] = useState([
    {
      id: 'c1',
      tokenNumber: 'A-145',
      serviceName: 'Driving Licence Renewal',
      officeName: 'Regional Transport Office (RTO Rajkot)',
      date: 'Oct 4, 2026',
      duration: '7 mins',
      counter: 'Counter 4',
      officer: 'Rajesh Sharma',
      rating: 5
    },
    {
      id: 'c2',
      tokenNumber: 'B-022',
      serviceName: 'Birth Certificate Attestation',
      officeName: 'Rajkot Municipal Corporation HQ',
      date: 'Sep 15, 2026',
      duration: '12 mins',
      counter: 'Counter 2',
      officer: 'Meena Patel',
      rating: 4
    },
    {
      id: 'c3',
      tokenNumber: 'D-109',
      serviceName: 'Property Tax Assessment Copy',
      officeName: 'RMC West Zone Civil Center',
      date: 'Aug 22, 2026',
      duration: '5 mins',
      counter: 'Counter 1',
      officer: 'Kishore Dave',
      rating: 5
    }
  ]);

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Link href="/citizen/token-history" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Screen 34 • History
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">Completed Services</h1>
          </div>
        </div>
        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
          {completedList.length} Fulfilled
        </span>
      </div>

      {/* List */}
      <div className="space-y-3">
        {completedList.map((item) => (
          <Link key={item.id} href={`/citizen/token-history/${item.id}`} className="block">
            <Card className="border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{item.serviceName}</h3>
                      <p className="text-xs text-slate-500 flex items-center mt-0.5">
                        <Building2 size={12} className="mr-1 text-slate-400" />
                        {item.officeName}
                      </p>
                    </div>
                  </div>
                  <span className="font-black text-slate-900 text-base">{item.tokenNumber}</span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center">
                      <Calendar size={13} className="mr-1 text-slate-400" /> {item.date}
                    </span>
                    <span className="flex items-center text-emerald-700 font-medium">
                      <Clock size={13} className="mr-1" /> {item.duration}
                    </span>
                  </div>
                  <div className="flex text-amber-400">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} size={12} className="fill-amber-400" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
