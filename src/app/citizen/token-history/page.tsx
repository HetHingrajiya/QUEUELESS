"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Calendar, Clock, Building2, Ticket, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function CitizenTokenHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/citizen/token-history');
        const json = await res.json();
        if (json.success) {
          setHistory(json.data);
        }
      } catch (error) {
        console.error('Failed to load token history', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'COMPLETED': return <CheckCircle2 size={16} className="text-emerald-500 mr-1.5" />;
      case 'NO_SHOW':
      case 'CANCELLED': return <XCircle size={16} className="text-red-500 mr-1.5" />;
      default: return <Clock size={16} className="text-blue-500 mr-1.5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'NO_SHOW':
      case 'CANCELLED': return 'bg-red-50 text-red-700 border-red-200';
      case 'WAITING':
      case 'CHECKED_IN': return 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse';
      case 'CALLED':
      case 'SERVING': return 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-extrabold text-slate-800">Past Visits</h2>
        <p className="text-slate-500">History of your queue tokens and appointments.</p>
      </div>

      {history.length > 0 ? (
        <div className="space-y-4">
          {history.map((token) => (
            <Link key={token._id} href={`/citizen/queue/${token._id}`} className="block transition-transform hover:-translate-y-1">
              <Card className="hover:shadow-md transition-shadow border-slate-200">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mr-4 shrink-0">
                        <Ticket className="text-slate-400" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">{token.serviceName}</h3>
                        <p className="text-sm text-slate-500 flex items-center mt-0.5">
                          <Building2 size={14} className="mr-1.5 shrink-0" />
                          <span className="line-clamp-1">{token.officeName}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-xl font-black text-slate-800 tracking-tight">{token.tokenNumber}</p>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center text-xs text-slate-500">
                      <Calendar size={14} className="mr-1.5" />
                      {new Date(token.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center ${getStatusColor(token.status)}`}>
                      {getStatusIcon(token.status)}
                      {token.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Ticket className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">No token history</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">
            You haven't generated any queue tokens yet.
          </p>
          <Link href="/citizen/offices">
            <span className="inline-flex items-center justify-center h-10 px-6 font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">
              Book a Token
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
