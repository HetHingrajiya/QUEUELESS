"use client";
import { Card, CardContent } from '@/components/ui/card';
import { HelpCircle, Mail, Phone, MessageSquare, ChevronRight, FileText, Info, Activity, WifiOff, AlertTriangle, ShieldAlert, Clock, Inbox, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CitizenHelpPage() {
  const faqs = [
    { q: "How do I book a token?", a: "Find an office near you, select the service you need, and tap 'Take Virtual Token'." },
    { q: "What happens if I miss my turn?", a: "You have a small grace period. After that, your token will be marked as 'No Show' and you'll need to generate a new one." },
    { q: "Can I cancel my token?", a: "Yes, you can cancel your token from the Live Queue page if you no longer plan to visit." }
  ];

  return (
    <div className="space-y-6 pb-12 max-w-lg mx-auto">
      <div className="flex flex-col space-y-2 mb-6">
        <h2 className="text-2xl font-extrabold text-slate-800">Help & Support</h2>
        <p className="text-slate-500">How can we assist you today?</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link href="/citizen/help/contact" className="block">
          <Card className="border-slate-200 hover:border-blue-300 transition-colors cursor-pointer bg-blue-50/50 h-full">
            <CardContent className="p-4 text-center">
              <MessageSquare size={24} className="text-blue-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-800 text-sm">Help Desk</p>
              <p className="text-[10px] text-slate-500 mt-1">Submit support ticket</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/citizen/help/contact" className="block">
          <Card className="border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer bg-emerald-50/50 h-full">
            <CardContent className="p-4 text-center">
              <Phone size={24} className="text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-800 text-sm">Helpline Desk</p>
              <p className="text-[10px] text-slate-500 mt-1">Direct officer contact</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-2 mb-3">Frequently Asked Questions</h3>
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <Card key={idx} className="border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <h4 className="font-bold text-slate-800 mb-1 flex items-start">
                  <HelpCircle size={18} className="text-blue-500 mr-2 shrink-0 mt-0.5" />
                  {faq.q}
                </h4>
                <p className="text-slate-600 text-sm pl-6">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-2 mb-3">Other Resources</h3>
        <Card className="border-slate-200 overflow-hidden">
          <CardContent className="p-0 divide-y divide-slate-100">
            <Link href="/citizen/help/contact" className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center text-slate-700 font-medium">
                <MessageSquare size={18} className="text-blue-500 mr-3" />
                Contact Support Desk
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </Link>
            <Link href="/citizen/about" className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center text-slate-700 font-medium">
                <Info size={18} className="text-indigo-500 mr-3" />
                About QueueLess & Platform Vision
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </Link>
            <Link href="/citizen/feedback" className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center text-slate-700 font-medium">
                <Mail size={18} className="text-slate-400 mr-3" />
                Send Feedback & Suggestions
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-2 mb-3">System Diagnostics & Status Views</h3>
        <Card className="border-slate-200 overflow-hidden">
          <CardContent className="p-0 divide-y divide-slate-100 text-xs">
            <Link href="/citizen/status/no-internet" className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors">
              <div className="flex items-center text-slate-700 font-medium">
                <WifiOff size={16} className="text-amber-500 mr-3" />
                Offline Mode & No Internet Screen
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </Link>
            <Link href="/citizen/status/server-error" className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors">
              <div className="flex items-center text-slate-700 font-medium">
                <AlertTriangle size={16} className="text-red-500 mr-3" />
                Server Error Diagnostic (500 Page)
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </Link>
            <Link href="/citizen/status/unauthorized" className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors">
              <div className="flex items-center text-slate-700 font-medium">
                <ShieldAlert size={16} className="text-indigo-500 mr-3" />
                Access Permission / Unauthorized (401/403)
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </Link>
            <Link href="/citizen/status/session-expired" className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors">
              <div className="flex items-center text-slate-700 font-medium">
                <Clock size={16} className="text-slate-500 mr-3" />
                Session Expiration Handler
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </Link>
            <Link href="/citizen/status/empty-state" className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors">
              <div className="flex items-center text-slate-700 font-medium">
                <Inbox size={16} className="text-slate-400 mr-3" />
                Standard Empty State View
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </Link>
            <Link href="/citizen/status/loading" className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors">
              <div className="flex items-center text-slate-700 font-medium">
                <Loader2 size={16} className="text-blue-500 mr-3" />
                Loading Skeletons Preview
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
