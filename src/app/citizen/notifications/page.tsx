"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Bell, CheckCircle2, Clock, Volume2, 
  ArrowRight, Check, Trash2, ShieldCheck, Info 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { EmptyState } from '@/components/common/EmptyState';

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  officeId?: { _id: string; name: string };
  tokenId?: { _id: string; tokenNumber: string; status: string };
}

export default function CitizenNotificationsPage() {
  const [filter, setFilter] = useState<'ALL' | 'QUEUE' | 'SYSTEM'>('ALL');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/citizen/notifications?category=${filter}`);
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data.notifications || []);
      } else {
        setError(json.message || 'Failed to load notifications');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotifications();
    }, 0);
    return () => clearTimeout(timer);
  }, [filter]);

  const markAllRead = async () => {
    try {
      await fetch('/api/citizen/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true })
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const markSingleRead = async (id: string) => {
    try {
      await fetch('/api/citizen/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id })
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/citizen/notifications?id=${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
            Screen 36 • Notifications
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">Notification Center</h1>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center transition-colors"
          >
            <Check size={14} className="mr-1" /> Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        {(['ALL', 'QUEUE', 'SYSTEM'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === tab
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonLoader type="notification" count={4} />
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={32} />}
          title="No Notifications"
          description={filter === 'ALL' ? "You're all caught up! Live token and queue alerts will appear here." : `No ${filter.toLowerCase()} notifications found.`}
          actionText="Explore Offices"
          actionHref="/citizen/offices"
        />
      ) : (
        <div className="space-y-3">
          {notifications.map(item => (
            <Card
              key={item._id}
              onClick={() => markSingleRead(item._id)}
              className={`border-slate-200 transition-all cursor-pointer hover:border-blue-300 ${
                !item.isRead ? 'bg-blue-50/50 border-blue-200' : 'bg-white'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      item.type === 'QUEUE' || item.type === 'TOKEN_CALLED'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.type === 'TOKEN_CALLED' ? <Volume2 size={18} /> : <Bell size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{item.title}</h4>
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                        <span>{new Date(item.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        {item.officeId?.name && (
                          <span className="font-medium text-slate-600 truncate max-w-[140px]">{item.officeId.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteNotification(item._id, e)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                    title="Delete notification"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
