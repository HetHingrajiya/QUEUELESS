"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Phone, Mail, Clock, 
  Send, CheckCircle2, Headphones, AlertCircle 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SupportTicket, ApiResponse } from '@/types/citizen';

export default function ContactSupportPage() {
  const router = useRouter();
  const [ticketSubject, setTicketSubject] = useState('');
  const [category, setCategory] = useState('General Inquiry');
  const [ticketMessage, setTicketMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<SupportTicket | null>(null);
  const [existingTickets, setExistingTickets] = useState<SupportTicket[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/citizen/support');
      const json: ApiResponse<SupportTicket[]> = await res.json();
      if (json.success && json.data) {
        setExistingTickets(json.data);
      }
    } catch (err: unknown) {
      console.error(err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTickets();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch('/api/citizen/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: ticketSubject,
          category,
          message: ticketMessage
        })
      });
      const json: ApiResponse<SupportTicket> = await res.json();
      if (json.success && json.data) {
        setSubmittedTicket(json.data);
        setTicketSubject('');
        setTicketMessage('');
        fetchTickets();
      } else {
        setError(json.message || 'Failed to submit ticket');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission error');
    } finally {
      setSubmitting(false);
    }
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
<h1 className="text-xl font-bold text-slate-900 mt-0.5">Contact Support</h1>
          </div>
        </div>
      </div>

      {/* Quick Helpline Channels */}
      <div className="grid grid-cols-2 gap-3">
        <a href="tel:1800112233" className="block">
          <Card className="hover:border-blue-300 transition-all cursor-pointer bg-white">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <Phone size={18} />
              </div>
              <p className="font-bold text-xs text-slate-900">Toll-Free Helpline</p>
              <p className="text-[11px] text-slate-500 mt-0.5">1800-11-2233</p>
            </CardContent>
          </Card>
        </a>

        <a href="mailto:support@samaysetu.gov.in" className="block">
          <Card className="hover:border-emerald-300 transition-all cursor-pointer bg-white">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <Mail size={18} />
              </div>
              <p className="font-bold text-xs text-slate-900">Email Desk</p>
              <p className="text-[11px] text-slate-500 mt-0.5">support@samaysetu.gov</p>
            </CardContent>
          </Card>
        </a>
      </div>

      {/* SLA Hours Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center text-xs text-slate-600 space-x-2">
        <Clock size={16} className="text-blue-600 shrink-0" />
        <span>Desk Hours: Mon – Sat, 9:00 AM – 6:00 PM (IST). Typical ticket response within 2 hours.</span>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" /> {error}
        </div>
      )}

      {/* Ticket Creation Form */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardContent className="p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center">
            <Headphones size={15} className="mr-1.5 text-blue-600" />
            Submit an Inquiry Ticket
          </h3>

          {submittedTicket ? (
            <div className="py-6 text-center space-y-2">
              <CheckCircle2 size={40} className="text-emerald-500 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">Ticket Submitted Successfully</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Ticket ID: <span className="font-mono text-slate-800 font-bold">{submittedTicket._id}</span>. Our desk team has received your inquiry.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSubmittedTicket(null)}
                className="mt-3 text-xs"
              >
                Submit Another Inquiry
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <Label className="text-xs text-slate-600">Category</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full mt-1 h-10 px-3 border border-slate-200 rounded-xl text-xs bg-white text-slate-800"
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Token & Queue Issue">Token & Queue Issue</option>
                  <option value="AI Prediction Discrepancy">AI Prediction Discrepancy</option>
                  <option value="Office Facility Complaint">Office Facility Complaint</option>
                </select>
              </div>

              <div>
                <Label className="text-xs text-slate-600">Subject</Label>
                <Input
                  required
                  placeholder="e.g. Missed token due to incorrect time estimate"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="mt-1 h-10 text-xs rounded-xl"
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
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-xs font-bold"
              >
                <Send size={14} className="mr-2" /> {submitting ? 'Submitting Ticket...' : 'Submit Ticket'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Existing Tickets */}
      {existingTickets.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Submitted Tickets ({existingTickets.length})</h4>
          {existingTickets.map(t => (
            <div key={t._id} className="p-3.5 bg-white border border-slate-200 rounded-xl text-xs space-y-1.5 shadow-2xs">
              <div className="flex justify-between items-start">
                <span className="font-bold text-slate-900 line-clamp-1">{t.subject}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  t.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                }`}>
                  {t.status}
                </span>
              </div>
              <p className="text-slate-500 text-[11px] line-clamp-2">{t.message}</p>
              {t.adminReply && (
                <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-700">
                  <span className="font-bold text-blue-600 block">Support Reply:</span>
                  {t.adminReply}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
