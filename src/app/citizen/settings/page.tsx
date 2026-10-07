"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, Smartphone, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CitizenSettingsPage() {
  const [preferences, setPreferences] = useState({
    sms: true,
    email: true,
    push: false,
    queueAlerts: true,
    promotions: false
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load from local storage for MVP
    const stored = localStorage.getItem('queueless_notifications');
    if (stored) {
      setPreferences(JSON.parse(stored));
    }
  }, []);

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setSaved(false);
  };

  const savePreferences = () => {
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem('queueless_notifications', JSON.stringify(preferences));
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-12 max-w-lg mx-auto">
      <div className="flex flex-col space-y-2 mb-6">
        <h2 className="text-2xl font-extrabold text-slate-800">Notification Settings</h2>
        <p className="text-slate-500">Manage how and when you want to be notified.</p>
      </div>

      <Card className="border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center">
          <Bell className="text-blue-500 mr-3" size={20} />
          <h3 className="font-bold text-slate-800">Delivery Methods</h3>
        </div>
        <CardContent className="p-0 divide-y divide-slate-100">
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-4">
                <Smartphone size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">SMS Alerts</p>
                <p className="text-xs text-slate-500">Get updates via text message</p>
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
                <p className="font-semibold text-slate-800">Email Notifications</p>
                <p className="text-xs text-slate-500">Receive emails for your tokens</p>
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
                <p className="font-semibold text-slate-800">Push Notifications</p>
                <p className="text-xs text-slate-500">In-app notifications</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={preferences.push} onChange={() => handleToggle('push')} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="pt-4">
        <Button 
          onClick={savePreferences} 
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-semibold"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
        
        {saved && (
          <p className="text-center text-sm text-emerald-600 mt-3 flex items-center justify-center font-medium">
            <CheckCircle2 size={16} className="mr-1.5" /> Settings saved successfully
          </p>
        )}
      </div>
    </div>
  );
}
