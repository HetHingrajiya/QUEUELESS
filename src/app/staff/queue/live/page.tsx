"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Filter, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socketClient';

export interface QueueToken {
  _id: string;
  tokenNumber: string;
  citizenName: string;
  serviceName: string;
  priority: boolean;
  status: string;
  createdAt: string;
}

export default function StaffQueuePage() {
  const router = useRouter();
  const [tokens, setTokens] = useState<QueueToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchQueueData = async () => {
    try {
      const res = await fetch('/api/staff/queue');
      const json = await res.json();
      if (json.success) {
        setTokens(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        
        if (userData.success && userData.data.officeId) {
          const socket = getSocket();
          socket.emit('join-office', userData.data.officeId);
          
          socket.on('queue:updated', () => fetchQueueData());
          socket.on('token:called', () => fetchQueueData());
        }
        await fetchQueueData();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      const socket = getSocket();
      socket.off('queue:updated');
      socket.off('token:called');
    };
  }, []);

  const filteredTokens = tokens.filter(t => 
    t.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.citizenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.serviceName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="mr-2" onClick={() => router.back()}>
            <ArrowLeft size={16} />
          </Button>
          <h2 className="text-2xl font-bold text-slate-800">Live Queue</h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Waiting Tokens</CardTitle>
          <CardDescription>Real-time view of all tokens currently waiting for your counter</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search token or name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
          
          <div className="border border-slate-200 rounded-md overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Token Number</th>
                  <th className="px-4 py-3 font-medium">Citizen Name</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Wait Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading queue...
                    </td>
                  </tr>
                ) : filteredTokens.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                      No tokens waiting in the queue.
                    </td>
                  </tr>
                ) : (
                  filteredTokens.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50 transition-colors text-slate-600">
                      <td className="px-4 py-3 font-bold text-slate-900">{item.tokenNumber}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{item.citizenName}</td>
                      <td className="px-4 py-3">{item.serviceName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'WAITING' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">
                        {Math.floor((Date.now() - new Date(item.createdAt).getTime()) / 60000)} mins
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
