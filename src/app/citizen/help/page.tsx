"use client";
import { Card, CardContent } from '@/components/ui/card';
import { HelpCircle, Mail, Phone, MessageSquare, ChevronRight, FileText } from 'lucide-react';
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
        <Card className="border-slate-200 hover:border-blue-300 transition-colors cursor-pointer bg-blue-50/50">
          <CardContent className="p-4 text-center">
            <MessageSquare size={24} className="text-blue-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-800 text-sm">Live Chat</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer bg-emerald-50/50">
          <CardContent className="p-4 text-center">
            <Phone size={24} className="text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-800 text-sm">Call Us</p>
          </CardContent>
        </Card>
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
            <Link href="/citizen/feedback" className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center text-slate-700 font-medium">
                <Mail size={18} className="text-slate-400 mr-3" />
                Send Feedback
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </Link>
            <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="flex items-center text-slate-700 font-medium">
                <FileText size={18} className="text-slate-400 mr-3" />
                Terms of Service
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
