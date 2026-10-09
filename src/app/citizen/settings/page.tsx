"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, Smartphone, Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  return (
    <div className="space-y-6 pb-20 max-w-lg mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Link href="/citizen/profile" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
<h1 className="text-xl font-bold text-slate-900 mt-0.5">Notification Settings</h1>
          </div>
        </div>
      </div>

      <Card className="border-slate-200 overflow-hidden bg-white shadow-sm">
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center">
          <Bell className="text-blue-500 mr-3" size={20} />
          <h3 className="font-bold text-slate-800 text-sm">Delivery Channels</h3>
        </div>
        <CardContent className="p-0 divide-y divide-slate-100">
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-4">
                <Smartphone size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">SMS Alerts</p>
                <p className="text-xs text-slate-500">Receive token calls via text message</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={preferences.sms} onChange={() => handleToggle('sms')} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mr-4">
                <Mail size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">Email Confirmations</p>
                <p className="text-xs text-slate-500">Receipts and completion summaries</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={preferences.email} onChange={() => handleToggle('email')} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mr-4">
                <AlertCircle size={18} className="text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">Push Notifications</p>
                <p className="text-xs text-slate-500">Instant sound chimes for counter call</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={preferences.push} onChange={() => handleToggle('push')} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell size={20} className="text-purple-600 shrink-0" />
          <div>
            <p className="text-xs font-bold text-slate-800">Browser Sound & Push Permission</p>
            <p className="text-[10px] text-slate-500">Configure device chime audio and system alerts</p>
          </div>
        </div>
        <Link
          href="/citizen/permissions/notification"
          className="text-xs font-bold text-purple-700 bg-white px-3 py-1.5 rounded-lg border border-purple-200 hover:bg-purple-50 transition-colors"
        >
          Manage
        </Link>
      </div>

      <Button
        onClick={savePreferences}
        disabled={saving}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-bold text-xs"
      >
        {saving ? 'Saving to Database...' : 'Save Notification Preferences'}
      </Button>

      {saved && (
        <p className="text-center text-xs text-emerald-600 font-semibold flex items-center justify-center">
          <CheckCircle2 size={14} className="mr-1.5" /> Preferences saved in MongoDB!
        </p>
      )}
    </div>
  );
}
