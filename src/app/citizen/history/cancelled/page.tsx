"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, XCircle, Calendar, Clock, 
  Building2, Ticket, RefreshCw, AlertTriangle, ArrowRight 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CancelledTokensHistoryPage() {
  const [cancelledList] = useState([
    {
      id: 'cx-1',
      tokenNumber: 'C-089',
      serviceName: 'Property Tax Challan Submission',
      officeName: 'Rajkot Municipal Corporation West Zone',
      date: 'Aug 2, 2026',
      reason: 'No-Show (Grace period expired after 5 mins)',
      type: 'NO_SHOW'
    },
    {
      id: 'cx-2',
      tokenNumber: 'A-019',
      serviceName: 'Driving Licence Renewal',
      officeName: 'Regional Transport Office (RTO Rajkot)',
      date: 'Jul 14, 2026',
      reason: 'Citizen requested cancellation prior to arrival',
      type: 'USER_CANCELLED'
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2 py-0.5 rounded">
              Screen 35 • History
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">Cancelled Tokens</h1>
          </div>
        </div>
        <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full">
          {cancelledList.length} Records
        </span>
      </div>

      {/* List */}
      <div className="space-y-3">
        {cancelledList.map((item) => (
          <Card key={item.id} className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <XCircle size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{item.serviceName}</h3>
                    <p className="text-xs text-slate-500 flex items-center mt-0.5">
                      <Building2 size={12} className="mr-1 text-slate-400" />
                      {item.officeName}
                    </p>
                  </div>
                </div>
                <span className="font-black text-slate-400 text-base line-through">{item.tokenNumber}</span>
              </div>

              <div className="bg-slate-50 rounded-lg p-2.5 my-2 border border-slate-100 text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Reason:</span> {item.reason}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center">
                  <Calendar size={13} className="mr-1 text-slate-400" /> {item.date}
                </span>
                <Link href="/citizen/token">
                  <span className="text-blue-600 font-bold hover:underline flex items-center">
                    Re-Book <ArrowRight size={13} className="ml-1" />
                  </span>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
