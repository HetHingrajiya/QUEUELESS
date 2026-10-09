"use client";

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Volume2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { CitizenNotification, ApiResponse } from '@/types/citizen';

export default function NotificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [notification, setNotification] = useState<CitizenNotification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/citizen/notifications/${id}`)
      .then(r => r.json() as Promise<ApiResponse<CitizenNotification>>)
      .then(res => {
        if (res.success && res.data) {
          setNotification(res.data);
        } else {
          setError(res.message || 'Notification not found');
        }
      })
      .catch((err: unknown) => {
        console.error(err);
        setError('Failed to load notification');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto pt-6">
        <SkeletonLoader type="notification" />
      </div>
    );
  }

  if (error || !notification) {
    return (
      <div className="max-w-md mx-auto pt-6 text-center">
        <p className="text-red-600 font-medium">{error || 'Notification not found'}</p>
        <Link href="/citizen/notifications" className="text-blue-600 font-semibold text-sm mt-3 inline-block">
          Return to Notifications
        </Link>
      </div>
    );
  }

  const title = notification?.title || 'Notification Alert';
  const body = notification?.message || 'Details for this system notification.';
  const type = notification?.type || 'SYSTEM';
  const date = notification?.createdAt ? new Date(notification.createdAt).toLocaleString() : 'Not available';
  const officeName = (typeof notification?.officeId === 'object' && notification.officeId !== null ? notification.officeId.name : notification?.officeName) || 'Smart Queue System';

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <button 
            onClick={() => router.back()} 
            className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
<h1 className="text-xl font-bold text-slate-900 mt-0.5">Notification Details</h1>
          </div>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md shrink-0">
            {type === 'TOKEN_CALLED' ? <Volume2 size={24} /> : <Bell size={24} />}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
              {type}
            </span>
            <h3 className="font-bold text-base mt-1 truncate">{title}</h3>
          </div>
        </div>

        <CardContent className="p-6 space-y-4 text-xs">
          <div className="flex justify-between items-center text-slate-400 border-b border-slate-100 pb-3">
            <span>Received:</span>
            <span className="font-medium text-slate-700">{date}</span>
          </div>

          <div className="flex justify-between items-center text-slate-400 border-b border-slate-100 pb-3">
            <span>Originating Authority:</span>
            <span className="font-bold text-slate-800">{officeName}</span>
          </div>

          <div className="py-2">
            <p className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider mb-1.5">
              Message Content
            </p>
            <p className="text-slate-800 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {body}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CTA Button */}
      <div className="space-y-2">
        <Link href="/citizen/notifications" className="block w-full">
          <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs">
            Back to All Notifications
          </Button>
        </Link>
      </div>
    </div>
  );
}
