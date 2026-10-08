"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Phone, Mail, MessageSquare, Clock, 
  Send, CheckCircle2, ShieldCheck, Headphones 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ContactSupportPage() {
  const router = useRouter();
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Link href="/citizen/help" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Screen 50 • Support
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">Contact Support</h1>
          </div>
        </div>
      </div>

      {/* Quick Helpline Channels */}
      <div className="grid grid-cols-2 gap-3">
        <a href="tel:1800112233" className="block">
          <Card className="hover:border-blue-300 transition-all cursor-pointer">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <Phone size={18} />
              </div>
              <p className="font-bold text-xs text-slate-900">Toll-Free Helpline</p>
              <p className="text-[11px] text-slate-500 mt-0.5">1800-11-2233</p>
            </CardContent>
          </Card>
        </a>

        <a href="mailto:support@queueless.gov.in" className="block">
          <Card className="hover:border-emerald-300 transition-all cursor-pointer">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <Mail size={18} />
              </div>
              <p className="font-bold text-xs text-slate-900">Email Desk</p>
              <p className="text-[11px] text-slate-500 mt-0.5">support@queueless</p>
            </CardContent>
          </Card>
        </a>
      </div>

      {/* SLA Hours Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center text-xs text-slate-600 space-x-2">
        <Clock size={16} className="text-blue-600 shrink-0" />
        <span>Desk Hours: Mon – Sat, 9:00 AM – 6:00 PM (IST). Typical ticket response within 2 hours.</span>
      </div>

      {/* Ticket Creation Form */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center">
            <Headphones size={15} className="mr-1.5 text-blue-600" />
            Submit an Inquiry Ticket
          </h3>

          {submitted ? (
            <div className="py-6 text-center space-y-2">
              <CheckCircle2 size={40} className="text-emerald-500 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">Ticket #QL-9921 Submitted</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                A customer support representative will follow up with you via your registered email shortly.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSubmitted(false)}
                className="mt-3 text-xs"
              >
                Send Another Inquiry
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <Label className="text-xs text-slate-600">Issue Category / Subject</Label>
                <Input
                  required
                  placeholder="e.g. Missed token due to incorrect time estimate"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="mt-1 h-10 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs text-slate-600">Detailed Message</Label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain what happened, including token numbers or office location..."
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-xs font-bold"
              >
                <Send size={14} className="mr-2" /> Submit Ticket
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
