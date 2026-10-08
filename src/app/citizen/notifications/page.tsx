"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  Bell, CheckCircle2, Clock, Volume2, 
  ArrowRight, Check, Trash2, ShieldCheck, Info 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CitizenNotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'queue' | 'system'>('all');
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: "Your Token Has Been Called!",
      body: "Token A-145 is now being called to Counter 4 (Officer Rajesh Sharma). Please proceed within 5 minutes.",
      time: "2 mins ago",
      type: "CALL",
      category: "queue",
      read: false,
      link: "/citizen/token-lifecycle/called"
    },
    {
      id: 'notif-2',
      title: "Time to Leave for RTO Rajkot",
      body: "Recommended departure window has started. Estimated travel time is 14 minutes in light traffic.",
      time: "25 mins ago",
      type: "TRAVEL",
      category: "queue",
      read: false,
      link: "/citizen/queue/leave-time"
    },
    {
      id: 'notif-3',
      title: "Geofence Check-In Confirmed",
      body: "Welcome to RTO Rajkot. You are successfully checked into Waiting Hall B.",
      time: "1 hour ago",
      type: "CHECKIN",
      category: "queue",
      read: true,
      link: "/citizen/check-in/success"
    },
    {
      id: 'notif-4',
      title: "System Maintenance Notice",
      body: "QueueLess server scheduled backup tonight at 2:00 AM. In-progress queues will remain uninterrupted.",
      time: "Yesterday",
      type: "SYSTEM",
      category: "system",
      read: true,
      link: "/citizen/notifications/notif-4"
    }
  ]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const filtered = notifications.filter(n => filter === 'all' || n.category === filter);
  const unreadCount = notifications.filter(n => !n.read).length;

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
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center"
          >
            <Check size={14} className="mr-1" /> Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('queue')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            filter === 'queue'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Queue Alerts
        </button>
        <button
          onClick={() => setFilter('system')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            filter === 'system'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          System
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((item) => (
            <Link key={item.id} href={item.link} className="block group">
              <Card
                className={`border transition-all ${
                  item.read
                    ? 'border-slate-200 bg-white hover:border-slate-300'
                    : 'border-blue-200 bg-blue-50/40 hover:border-blue-400 shadow-xs'
                }`}
              >
                <CardContent className="p-4 flex items-start space-x-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      item.type === 'CALL'
                        ? 'bg-amber-100 text-amber-700'
                        : item.type === 'TRAVEL'
                        ? 'bg-indigo-100 text-indigo-700'
                        : item.type === 'CHECKIN'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.type === 'CALL' ? (
                      <Volume2 size={20} />
                    ) : item.type === 'TRAVEL' ? (
                      <Clock size={20} />
                    ) : item.type === 'CHECKIN' ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <Info size={20} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors flex items-center">
                        {!item.read && <span className="w-2 h-2 rounded-full bg-blue-600 mr-2 shrink-0"></span>}
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">{item.time}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {item.body}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <Bell size={36} className="mx-auto text-slate-300 mb-2" />
            <h3 className="font-bold text-slate-700">No Notifications</h3>
            <p className="text-xs text-slate-400 mt-0.5">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}
