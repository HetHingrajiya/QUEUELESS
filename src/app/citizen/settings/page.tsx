"use client";

import { useState, useEffect } from 'react';
import { Bell, Smartphone, Mail, AlertCircle, CheckCircle2, ArrowLeft, Settings2, Save } from 'lucide-react';
import Link from 'next/link';

export default function CitizenSettingsPage() {
  const [preferences, setPreferences] = useState({
    sms: true,
    email: true,
    push: true,
    queueAlerts: true,
    promotions: false
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/citizen/profile');
        const json = await res.json();
        if (json.success && json.data?.settings?.notifications) {
          setPreferences(json.data.settings.notifications);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setSaved(false);
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/citizen/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            notifications: preferences
          }
        })
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const NeumorphicToggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button 
      type="button"
      onClick={onChange}
      className={`w-14 h-8 rounded-full transition-all duration-300 relative shrink-0 ${
        checked ? 'bg-primary/10 shadow-neu-inset' : 'bg-background shadow-neu-inset'
      }`}
    >
      <div 
        className={`absolute top-1 w-6 h-6 rounded-full bg-background flex items-center justify-center transition-all duration-300 ${
          checked ? 'left-7 shadow-[0_0_8px_rgba(var(--primary),0.6)]' : 'left-1 shadow-neu'
        }`}
      >
        {checked && <div className="w-2 h-2 rounded-full bg-primary" />}
      </div>
    </button>
  );

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      {/* Header */}
      <div className="flex items-center mb-8 px-4 sm:px-6 lg:px-8">
        <Link href="/citizen/profile">
          <button className="w-12 h-12 mr-4 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-full transition-all text-muted-foreground hover:text-foreground shrink-0 border-0">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Notification Settings</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold">Control how we communicate queue updates to you.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 px-4 sm:px-6 lg:px-8">
        
        {/* Left Column: Context */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-10 text-center border-0">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-8">Alert Channels</p>
            
            <div className="w-32 h-32 rounded-full mx-auto bg-background shadow-neu-inset flex items-center justify-center mb-6 text-primary">
              <Bell size={48} className="text-primary opacity-80" />
            </div>
            
            <h2 className="text-xl font-black text-foreground tracking-tight mb-8">Never Miss Your Turn</h2>
            
            <div className="bg-background shadow-neu-inset p-5 rounded-2xl border-2 border-primary/10 text-left">
              <Settings2 size={24} className="text-primary mb-3" />
              <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                Smart queue alerts ensure you arrive precisely when called. We recommend leaving Push Notifications and SMS enabled.
              </p>
            </div>
          </div>

          <div className="bg-background shadow-neu rounded-[2rem] p-6 text-center border-0">
             <div className="w-14 h-14 rounded-2xl bg-background shadow-neu-inset flex items-center justify-center text-purple-500 mx-auto mb-4">
                <Bell size={24} />
             </div>
             <h3 className="font-bold text-sm text-foreground mb-1">Browser Chime Permission</h3>
             <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-4">Device Audio & Push</p>
             <Link href="/citizen/permissions/notification" className="block w-full">
               <button className="w-full h-12 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl text-xs uppercase font-black tracking-widest text-primary flex items-center justify-center transition-all border-0">
                 Manage Device Audio
               </button>
             </Link>
          </div>
        </div>

        {/* Right Column: Toggles */}
        <div className="lg:col-span-8">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-8 sm:p-10 border-0">
            <div className="space-y-6">
              
              {/* SMS Tracking */}
              <div className="bg-background shadow-neu-inset hover:shadow-neu rounded-3xl p-6 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-0 group">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-xl bg-background shadow-neu flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-105">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-foreground mb-1">SMS Alerts</h3>
                    <p className="text-xs font-semibold text-muted-foreground leading-relaxed max-w-md">
                      Receive critical token calls and "leave now" reminders directly via text message.
                    </p>
                  </div>
                </div>
                <NeumorphicToggle checked={preferences.sms} onChange={() => handleToggle('sms')} />
              </div>

              {/* Email */}
              <div className="bg-background shadow-neu-inset hover:shadow-neu rounded-3xl p-6 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-0 group">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-xl bg-background shadow-neu flex items-center justify-center text-emerald-500 shrink-0 transition-transform group-hover:scale-105">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-foreground mb-1">Email Confirmations</h3>
                    <p className="text-xs font-semibold text-muted-foreground leading-relaxed max-w-md">
                      Get detailed digital token receipts and end-of-service completion summaries.
                    </p>
                  </div>
                </div>
                <NeumorphicToggle checked={preferences.email} onChange={() => handleToggle('email')} />
              </div>

              {/* Push Notifications */}
              <div className="bg-background shadow-neu-inset hover:shadow-neu rounded-3xl p-6 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-0 group">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-xl bg-background shadow-neu flex items-center justify-center text-purple-500 shrink-0 transition-transform group-hover:scale-105">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-foreground mb-1">Push & Audio Chimes</h3>
                    <p className="text-xs font-semibold text-muted-foreground leading-relaxed max-w-md">
                      Instant floating notifications and audio sound chimes when it is your turn at the counter.
                    </p>
                  </div>
                </div>
                <NeumorphicToggle checked={preferences.push} onChange={() => handleToggle('push')} />
              </div>

              <div className="pt-8 flex flex-col sm:flex-row items-center gap-4">
                <button
                  onClick={savePreferences}
                  disabled={saving}
                  className="w-full sm:flex-1 h-16 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl text-sm uppercase font-black tracking-widest text-primary flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed border-0"
                >
                  {saving ? (
                    <span className="flex items-center"><span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3"></span> Saving...</span>
                  ) : (
                    <span className="flex items-center"><Save size={18} className="mr-3" /> Update Preferences</span>
                  )}
                </button>
                
                {saved && (
                  <div className="w-full sm:w-auto h-16 px-6 bg-background shadow-neu-inset rounded-2xl flex items-center justify-center border-2 border-emerald-500/20 text-emerald-500 text-xs font-black uppercase tracking-widest transition-all">
                    <CheckCircle2 size={16} className="mr-2" /> Saved
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
