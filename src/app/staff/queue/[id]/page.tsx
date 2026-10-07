"use client";

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, ArrowLeft, Clock, PlayCircle, CheckCircle2, UserX, SkipForward } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function StaffTokenDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [token, setToken] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTokenData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/staff/tokens/${id}`);
      const json = await response.json();
      
      if (json.success && json.data) {
        setToken(json.data);
      } else {
        setError(json.message || "Token not found.");
      }
    } catch (err) {
      setError("Failed to load token data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenData();
  }, [id]);

  const handleAction = async (action: string) => {
    try {
      setActionLoading(action);
      const res = await fetch('/api/staff/token/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, tokenId: id })
      });
      const data = await res.json();
      if (data.success) {
        await fetchTokenData();
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (error || !token) {
    return (
      <Card className="border-red-200 bg-red-50 mt-6">
        <CardContent className="p-6 text-center text-red-600">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{error || "Token not found"}</p>
          <Button onClick={() => router.back()} className="mt-4" variant="outline">
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WAITING': return 'bg-amber-100 text-amber-800';
      case 'CHECKED_IN': return 'bg-blue-100 text-blue-800';
      case 'CALLED': return 'bg-indigo-100 text-indigo-800';
      case 'SERVING': return 'bg-purple-100 text-purple-800';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800';
      case 'NO_SHOW': return 'bg-red-100 text-red-800';
      case 'SKIPPED': return 'bg-slate-200 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="mr-2" onClick={() => router.back()}>
            <ArrowLeft size={16} />
          </Button>
          <h2 className="text-2xl font-bold text-slate-800">Token Details: {token.tokenNumber}</h2>
        </div>
        <Badge className={getStatusColor(token.status)} variant="outline">
          {token.status.replace('_', ' ')}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Token Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 text-sm">
                <div>
                  <dt className="text-slate-500 font-medium">Citizen Name</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{token.citizenId?.fullName || 'Walk-in Citizen'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">Citizen Contact</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{token.citizenId?.mobile || token.citizenId?.email || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">Service</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{token.serviceId?.name}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">Priority</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{token.priority || 'NORMAL'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">Office</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{token.officeId?.name}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">Counter</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{token.counterId?.name}</dd>
                </div>
                {token.processingTime && (
                  <div>
                    <dt className="text-slate-500 font-medium">Processing Time</dt>
                    <dd className="mt-1 font-semibold text-slate-900">{Math.floor(token.processingTime / 60)}m {token.processingTime % 60}s</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {token.events && token.events.map((event: any, idx: number) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-blue-500 mt-1.5" />
                      {idx !== token.events.length - 1 && (
                        <div className="w-0.5 h-full bg-slate-200 mt-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="font-medium text-slate-900">{event.type}</p>
                      <p className="text-sm text-slate-500">{event.note}</p>
                      <p className="text-xs text-slate-400 mt-1">{format(new Date(event.time), 'PPp')}</p>
                    </div>
                  </div>
                ))}
                {(!token.events || token.events.length === 0) && (
                  <p className="text-sm text-slate-500">No events recorded yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Manage token status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(token.status === 'WAITING' || token.status === 'CHECKED_IN') && (
                <Button 
                  className="w-full justify-start bg-indigo-600 hover:bg-indigo-700" 
                  disabled={actionLoading !== null}
                  onClick={() => handleAction('CALL_NEXT')}
                >
                  {actionLoading === 'CALL_NEXT' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                  Call to Counter
                </Button>
              )}
              
              {token.status === 'CALLED' && (
                <Button 
                  className="w-full justify-start bg-purple-600 hover:bg-purple-700" 
                  disabled={actionLoading !== null}
                  onClick={() => handleAction('START')}
                >
                  {actionLoading === 'START' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4" />}
                  Start Service
                </Button>
              )}

              {token.status === 'SERVING' && (
                <Button 
                  className="w-full justify-start bg-emerald-600 hover:bg-emerald-700" 
                  disabled={actionLoading !== null}
                  onClick={() => handleAction('COMPLETE')}
                >
                  {actionLoading === 'COMPLETE' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  Complete Service
                </Button>
              )}

              {(token.status === 'CALLED' || token.status === 'WAITING' || token.status === 'CHECKED_IN') && (
                <Button 
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" 
                  disabled={actionLoading !== null}
                  onClick={() => handleAction('NO_SHOW')}
                >
                  {actionLoading === 'NO_SHOW' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserX className="mr-2 h-4 w-4" />}
                  Mark No Show
                </Button>
              )}

              {(token.status === 'WAITING' || token.status === 'CHECKED_IN') && (
                <Button 
                  variant="outline"
                  className="w-full justify-start text-slate-600 hover:bg-slate-50" 
                  disabled={actionLoading !== null}
                  onClick={() => handleAction('SKIP')}
                >
                  {actionLoading === 'SKIP' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SkipForward className="mr-2 h-4 w-4" />}
                  Skip Token
                </Button>
              )}

              {['COMPLETED', 'NO_SHOW', 'SKIPPED'].includes(token.status) && (
                <p className="text-sm text-center text-slate-500 py-2">
                  This token is inactive and cannot be modified.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
