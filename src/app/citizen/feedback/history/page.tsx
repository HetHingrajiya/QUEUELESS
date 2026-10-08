"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Star, MessageSquare, Building2, 
  Calendar, CheckCircle2, Clock, ThumbsUp 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function FeedbackHistoryPage() {
  const [history] = useState([
    {
      id: 'fb-1',
      serviceName: 'Driving Licence Renewal',
      officeName: 'Regional Transport Office (RTO Rajkot)',
      date: 'Oct 4, 2026',
      rating: 5,
      citizenComment: 'Extremely fast service! Officer Rajesh Sharma was very polite and the AI wait estimation was spot-on.',
      officeResponse: 'Thank you for your generous review! We are delighted the smart queue system saved you time.',
      status: 'ACKNOWLEDGED'
    },
    {
      id: 'fb-2',
      serviceName: 'Birth Certificate Attestation',
      officeName: 'Rajkot Municipal Corporation HQ',
      date: 'Sep 15, 2026',
      rating: 4,
      citizenComment: 'Waiting hall air conditioning was pleasant. Took slightly longer at biometric scan.',
      officeResponse: 'We have upgraded the biometric scanners this week for faster throughput. Thank you for flagging.',
      status: 'RESOLVED'
    }
  ]);

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Link href="/citizen/feedback" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              Screen 48 • Feedback
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">Feedback History</h1>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {history.map((item) => (
          <Card key={item.id} className="border-slate-200 shadow-sm overflow-hidden">
            <CardContent className="p-5 space-y-3 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{item.serviceName}</h3>
                  <p className="text-[11px] text-slate-500 flex items-center mt-0.5">
                    <Building2 size={12} className="mr-1 text-slate-400" />
                    {item.officeName}
                  </p>
                </div>
                <div className="flex text-amber-400">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} size={14} className="fill-amber-400" />
                  ))}
                </div>
              </div>

              {/* Citizen remarks */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Your Submission</p>
                <p className="text-slate-700 italic leading-relaxed">"{item.citizenComment}"</p>
              </div>

              {/* Office Response */}
              {item.officeResponse && (
                <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-blue-700 uppercase font-bold flex items-center">
                      <CheckCircle2 size={12} className="mr-1 text-blue-600" />
                      Official Office Response
                    </span>
                    <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-2 py-0.5 rounded">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-slate-800 text-[11px] leading-relaxed">{item.officeResponse}</p>
                </div>
              )}

              <div className="pt-1 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Submitted on {item.date}</span>
                <span className="text-emerald-600 font-semibold flex items-center">
                  <CheckCircle2 size={12} className="mr-1" /> Public Record Verified
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
