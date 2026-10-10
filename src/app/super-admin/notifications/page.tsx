"use client";
import { useState, useEffect } from 'react';
import { Save, Loader2, Bell, MessageSquare, Mail, Smartphone, Users, Clock } from 'lucide-react';

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    smsEnabled: true,
    pushEnabled: true,
    emailEnabled: true,
    notifyPeopleAhead: 5,
    notifyMinutesAhead: 15,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/system-settings');
      const data = await res.json();
      if (data.success && data.data) {
        setSettings({
          smsEnabled: data.data.smsEnabled ?? true,
          pushEnabled: data.data.pushEnabled ?? true,
          emailEnabled: data.data.emailEnabled ?? true,
          notifyPeopleAhead: data.data.notifyPeopleAhead ?? 5,
          notifyMinutesAhead: data.data.notifyMinutesAhead ?? 15,
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/system-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        // silently succeed for smooth UX or show toast (alert is blocked for neatness)
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [id]: parseInt(value) || 0
    }));
  };

  const handleSwitchChange = (id: string, checked: boolean) => {
    setSettings(prev => ({ ...prev, [id]: checked }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh] cursor-default">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Notification Settings</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold mt-1">Configure global SMS, Email, and Push notifications.</p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 space-y-6 lg:space-y-8 max-w-3xl">
        <div className="bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0">
          <div className="flex items-center gap-4 mb-8">
             <div className="w-12 h-12 bg-background shadow-neu-inset rounded-2xl flex items-center justify-center text-primary shrink-0">
                <Bell size={20} />
             </div>
             <div>
                <h2 className="text-lg font-black text-foreground">Channels Overview</h2>
                <p className="text-xs font-bold text-muted-foreground mt-1">Toggle notification channels across the platform</p>
             </div>
          </div>

          <div className="space-y-6">
             {/* SMS Toggle */}
             <div className="bg-background shadow-neu-inset rounded-[1.5rem] p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-background shadow-neu rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                      <MessageSquare size={16} />
                   </div>
                   <div>
                      <h3 className="text-sm font-black text-foreground">SMS Notifications</h3>
                      <p className="text-xs font-bold text-muted-foreground mt-1">Send text messages for critical alerts (Twilio).</p>
                   </div>
                </div>
                <button 
                  onClick={() => handleSwitchChange('smsEnabled', !settings.smsEnabled)}
                  className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none border-0 shadow-neu-inset ${settings.smsEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'}`}
                >
                   <span className={`pointer-events-none absolute left-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 transition-transform ${settings.smsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
             </div>

             {/* Push Toggle */}
             <div className="bg-background shadow-neu-inset rounded-[1.5rem] p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-background shadow-neu rounded-xl flex items-center justify-center text-purple-500 shrink-0">
                      <Smartphone size={16} />
                   </div>
                   <div>
                      <h3 className="text-sm font-black text-foreground">Push Notifications</h3>
                      <p className="text-xs font-bold text-muted-foreground mt-1">Send FCM push notifications to the Flutter app.</p>
                   </div>
                </div>
                <button 
                  onClick={() => handleSwitchChange('pushEnabled', !settings.pushEnabled)}
                  className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none border-0 shadow-neu-inset ${settings.pushEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'}`}
                >
                   <span className={`pointer-events-none absolute left-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 transition-transform ${settings.pushEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
             </div>

             {/* Email Toggle */}
             <div className="bg-background shadow-neu-inset rounded-[1.5rem] p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-background shadow-neu rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
                      <Mail size={16} />
                   </div>
                   <div>
                      <h3 className="text-sm font-black text-foreground">Email Notifications</h3>
                      <p className="text-xs font-bold text-muted-foreground mt-1">Send emails for account creation and reports.</p>
                   </div>
                </div>
                <button 
                  onClick={() => handleSwitchChange('emailEnabled', !settings.emailEnabled)}
                  className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none border-0 shadow-neu-inset ${settings.emailEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'}`}
                >
                   <span className={`pointer-events-none absolute left-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 transition-transform ${settings.emailEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
             </div>
          </div>
        </div>

        <div className="bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0">
          <div className="flex items-center gap-4 mb-8">
             <div className="w-12 h-12 bg-background shadow-neu-inset rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
                <Users size={20} />
             </div>
             <div>
                <h2 className="text-lg font-black text-foreground">Citizen Alerts</h2>
                <p className="text-xs font-bold text-muted-foreground mt-1">Configure when citizens are notified about their queue status</p>
             </div>
          </div>

          <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Notify when N people ahead</label>
                   <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                         <Users size={16} className="text-muted-foreground group-focus-within:text-amber-500 transition-colors" />
                      </div>
                      <input 
                         type="number"
                         id="notifyPeopleAhead"
                         value={settings.notifyPeopleAhead}
                         onChange={handleChange}
                         className="w-full h-14 pl-12 pr-4 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all border-0"
                      />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Notify when estimated time is &lt; N mins</label>
                   <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                         <Clock size={16} className="text-muted-foreground group-focus-within:text-amber-500 transition-colors" />
                      </div>
                      <input 
                         type="number"
                         id="notifyMinutesAhead"
                         value={settings.notifyMinutesAhead}
                         onChange={handleChange}
                         className="w-full h-14 pl-12 pr-4 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all border-0"
                      />
                   </div>
                </div>
             </div>
          </div>
        </div>

        <div className="flex justify-center md:justify-end">
           <button 
             onClick={handleSave} 
             disabled={saving}
             className="w-full md:w-auto h-14 px-10 bg-primary shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 rounded-2xl text-xs uppercase font-black tracking-widest text-primary-foreground flex items-center justify-center transition-all border-0 disabled:opacity-50 disabled:hover:translate-y-0"
           >
             {saving ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Save size={18} className="mr-2" />}
             SAVE NOTIFICATIONS
           </button>
        </div>
      </div>
    </div>
  );
}
