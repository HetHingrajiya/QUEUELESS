"use client";
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Clock, Calendar, MapPin, Briefcase, FileText } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CitizenHistory() {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch token history for the citizen
  useEffect(() => {
    // In a real app we'd fetch from an API like /api/citizen/history
    // For now we will mock it based on the design
    setTimeout(() => {
      setHistory([
        {
          _id: '1',
          tokenNumber: 'A-145',
          serviceName: 'Driving Licence',
          officeName: 'RTO Rajkot',
          date: '2026-10-04',
          status: 'COMPLETED',
          waitTime: 35
        },
        {
          _id: '2',
          tokenNumber: 'B-022',
          serviceName: 'Birth Certificate',
          officeName: 'RMC Main Branch',
          date: '2026-09-15',
          status: 'COMPLETED',
          waitTime: 18
        },
        {
          _id: '3',
          tokenNumber: 'C-089',
          serviceName: 'Property Tax',
          officeName: 'RMC West Zone',
          date: '2026-08-02',
          status: 'NO_SHOW',
          waitTime: 0
        }
      ]);
      setLoading(false);
    }, 800);
  }, []);

  return (
    <div className="space-y-6 pb-24 pt-6 max-w-md mx-auto">
      <div className="flex items-center mb-6 px-4">
        <Button variant="ghost" size="sm" className="mr-2 -ml-2 text-slate-500" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-2xl font-bold text-slate-800">Visit History</h2>
      </div>

      <div className="px-4">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search past visits..." 
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
          />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-32 bg-slate-100 rounded-xl"></CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <Card key={item._id} className="border-slate-200 overflow-hidden">
                <div className={`h-1.5 w-full ${item.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg flex items-center">
                        {item.tokenNumber}
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </h3>
                      <p className="text-sm font-medium text-slate-600 mt-1">{item.serviceName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 flex items-center justify-end">
                        <Calendar size={12} className="mr-1" />
                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                    <div className="flex items-center">
                      <MapPin size={14} className="mr-1" />
                      {item.officeName}
                    </div>
                    {item.status === 'COMPLETED' && (
                      <div className="flex items-center font-medium">
                        <Clock size={14} className="mr-1" />
                        Wait: {item.waitTime}m
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
