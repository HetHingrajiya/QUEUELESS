"use client";
import { useEffect, useState } from 'react';
import { Bell, Check, Loader2, Info, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';

export interface NotificationRecord {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const timeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
};

export default function StaffNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [markLoading, setMarkLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications');
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllAsRead = async () => {
    try {
      setMarkLoading(true);
      const res = await fetch('/api/notifications', { method: 'PATCH' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMarkLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle2 size={24} className="text-emerald-500" />;
      case 'WARNING': return <AlertTriangle size={24} className="text-amber-500" />;
      case 'ERROR': return <XCircle size={24} className="text-red-500" />;
      default: return <Info size={24} className="text-primary" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 lg:space-y-8 pb-20 max-w-4xl mx-auto pt-4 cursor-default">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-3 px-3 py-1 bg-red-500 text-white rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center">
                {unreadCount} NEW
              </span>
            )}
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold mt-1">Stay updated on queue and system activities.</p>
        </div>
        
        {unreadCount > 0 && (
          <button 
            disabled={markLoading}
            onClick={markAllAsRead}
            className="h-10 px-6 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl text-[10px] font-black tracking-widest text-foreground disabled:opacity-50 transition-all border-0 flex items-center justify-center shrink-0"
          >
            {markLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            MARK ALL AS READ
          </button>
        )}
      </div>

      <div className="px-4 sm:px-6 lg:px-8 space-y-6">
         {/* Notification List */}
         <div className="bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0 min-h-[500px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-[300px]">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-sm font-black text-foreground">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-center">
                <div className="w-20 h-20 bg-background shadow-neu-inset rounded-[2rem] flex items-center justify-center text-muted-foreground/30 mb-6">
                  <Bell size={32} />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-2">No Notifications</h3>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div 
                    key={notification._id} 
                    className={`p-6 rounded-[2rem] flex items-start gap-5 transition-all ${!notification.isRead ? 'bg-primary/5 shadow-none' : 'bg-background shadow-neu-inset'}`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${!notification.isRead ? 'bg-background shadow-neu' : 'bg-background shadow-none border border-primary/5'}`}>
                      {getIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-black truncate ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0 mt-1">
                          {timeAgo(notification.createdAt)}
                        </p>
                      </div>
                      <p className={`text-xs font-semibold mt-2 leading-relaxed ${!notification.isRead ? 'text-muted-foreground' : 'text-slate-400'}`}>
                        {notification.message}
                      </p>
                    </div>

                    {!notification.isRead && (
                      <div className="shrink-0 h-3 w-3 rounded-full bg-primary mt-2 shadow-lg shadow-primary/50"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
         </div>
      </div>
    </div>
  );
}
