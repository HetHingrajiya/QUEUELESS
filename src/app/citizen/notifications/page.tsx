"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Bell, CheckCircle2, Clock, Volume2, 
  ArrowRight, Check, Trash2, ShieldCheck, Info,
  Settings2, Activity
} from 'lucide-react';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { getSocket } from '@/lib/socketClient';

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
  const [retryCount, setRetryCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/citizen/notifications?category=${filter}`);
      if (!res.ok) throw new Error(`Unable to load notifications (${res.status})`);
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
  }, [filter, retryCount]);

  useEffect(() => {
    let socket: ReturnType<typeof getSocket> | null = null;
    let mounted = true;
    try {
      socket = getSocket();
      socket.emit('join-my-notifications');
      const refresh = () => {
        if (mounted) void fetchNotifications();
      };
      socket.on('notification:new', refresh);
      socket.on('NOTIFICATION_NEW', refresh);
      return () => {
        mounted = false;
        socket?.off('notification:new', refresh);
        socket?.off('NOTIFICATION_NEW', refresh);
      };
    } catch (socketError) {
      console.error('Live notification connection unavailable', socketError);
      return () => { mounted = false; };
    }
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

  const filters = [
    { id: 'ALL', label: 'All Alerts' },
    { id: 'QUEUE', label: 'Queue Updates' },
    { id: 'SYSTEM', label: 'System' }
  ] as const;

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto pt-4 px-4 sm:px-6 lg:px-8 cursor-default">
      
      {/* Header section */}
      <div className="flex flex-col space-y-2 mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Notification Center</h1>
        <p className="text-muted-foreground text-xs sm:text-sm font-semibold">Live updates, token calls, and system alerts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Column: Control Center */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Status Filters */}
          <div className="bg-background shadow-neu rounded-[2rem] p-6 border-0">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-6 flex items-center">
              <Settings2 size={16} className="text-primary mr-2" /> Filter Alerts
            </h3>
            
            <div className="flex flex-col space-y-3">
              {filters.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`w-full text-left px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-between ${
                    filter === tab.id
                      ? 'bg-background shadow-neu-inset text-primary border-2 border-primary/10'
                      : 'bg-background shadow-neu text-muted-foreground hover:shadow-neu-hover hover:text-foreground'
                  }`}
                >
                  <span>{tab.label}</span>
                  {filter === tab.id && <span className="w-2 h-2 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
          </div>

          {/* Global Actions */}
          <div className="bg-background shadow-neu rounded-[2rem] p-6 border-0">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-6 flex items-center">
              <Activity size={16} className="text-primary mr-2" /> Actions
            </h3>
            
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className={`w-full h-14 rounded-xl text-xs uppercase font-black tracking-widest flex items-center justify-center transition-all ${
                unreadCount > 0 
                  ? 'bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset text-primary' 
                  : 'bg-background shadow-neu-inset text-muted-foreground opacity-50 cursor-not-allowed'
              }`}
            >
              <Check size={16} className="mr-2" /> Mark All as Read
            </button>
          </div>

        </div>

        {/* Right Column: Notification List */}
        <div className="lg:col-span-8">
          {loading ? (
            <LoadingState label="Loading notifications..." />
          ) : error ? (
            <ErrorState description={error} onRetry={() => setRetryCount((count) => count + 1)} />
          ) : notifications.length === 0 ? (
            <div className="bg-background shadow-neu rounded-[2rem] p-8 border-0">
              <EmptyState
                icon={<Bell size={48} className="text-primary/50" />}
                title="No Notifications"
                description={filter === 'ALL' ? "You're all caught up! Live token and queue alerts will appear here." : `No ${filter.toLowerCase()} notifications found.`}
                actionText="Explore Offices"
                actionHref="/citizen/offices"
              />
            </div>
          ) : (
            <div className="space-y-5">
              {notifications.map(item => (
                <div
                  key={item._id}
                  onClick={() => markSingleRead(item._id)}
                  className={`relative group bg-background rounded-3xl p-6 border-0 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-start justify-between gap-5 ${
                    !item.isRead 
                      ? 'shadow-neu border-2 border-primary/20' 
                      : 'shadow-neu-inset'
                  }`}
                >
                  {/* Left: Icon & Content */}
                  <div className="flex items-start gap-5 flex-1 min-w-0">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-neu-inset ${
                      item.type === 'QUEUE' || item.type === 'TOKEN_CALLED'
                        ? 'text-amber-500'
                        : 'text-primary'
                    }`}>
                      {item.type === 'TOKEN_CALLED' ? <Volume2 size={24} /> : <Bell size={24} />}
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className={`text-base font-extrabold truncate ${!item.isRead ? 'text-primary' : 'text-foreground'}`}>
                          {item.title}
                        </h4>
                        {!item.isRead && (
                          <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 animate-pulse" />
                        )}
                      </div>
                      <p className="text-sm font-semibold text-muted-foreground leading-relaxed pr-8">
                        {item.message}
                      </p>
                      
                      {/* Metadata Footer */}
                      <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-muted/10">
                        <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          <Clock size={12} className="mr-1.5 text-primary" />
                          {new Date(item.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {item.officeId?.name && (
                          <>
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30"></div>
                            <span className="text-[10px] font-bold text-foreground uppercase tracking-widest truncate max-w-[200px]">
                              {item.officeId.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Delete Action (Absolute on mobile, relative on desktop) */}
                  <button
                    onClick={(e) => deleteNotification(item._id, e)}
                    className="absolute top-6 right-6 sm:relative sm:top-0 sm:right-0 w-10 h-10 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl flex items-center justify-center text-muted-foreground hover:text-red-500 transition-all shrink-0"
                    title="Delete notification"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
