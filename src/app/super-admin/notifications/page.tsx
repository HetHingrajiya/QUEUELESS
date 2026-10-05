"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

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
        alert('Notification Settings saved successfully');
      } else {
        alert(data.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Server error');
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
    return <div className="p-6">Loading notification settings...</div>;
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Notification Settings</h2>
          <p className="text-sm text-slate-500">Configure global SMS, Email, and Push notification templates.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Channels Overview</CardTitle>
          <CardDescription>Toggle notification channels across the platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
            <div>
              <Label className="text-base font-semibold">SMS Notifications</Label>
              <p className="text-sm text-slate-500">Send text messages for critical alerts (Twilio).</p>
            </div>
            <Switch 
              checked={settings.smsEnabled} 
              onCheckedChange={(c) => handleSwitchChange('smsEnabled', c)} 
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
            <div>
              <Label className="text-base font-semibold">Push Notifications</Label>
              <p className="text-sm text-slate-500">Send FCM push notifications to the Flutter app.</p>
            </div>
            <Switch 
              checked={settings.pushEnabled} 
              onCheckedChange={(c) => handleSwitchChange('pushEnabled', c)} 
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
            <div>
              <Label className="text-base font-semibold">Email Notifications</Label>
              <p className="text-sm text-slate-500">Send emails for account creation and reports.</p>
            </div>
            <Switch 
              checked={settings.emailEnabled} 
              onCheckedChange={(c) => handleSwitchChange('emailEnabled', c)} 
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Citizen Alerts</CardTitle>
          <CardDescription>Configure when citizens are notified about their queue status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="notifyPeopleAhead">Notify when N people ahead</Label>
              <Input id="notifyPeopleAhead" type="number" value={settings.notifyPeopleAhead} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notifyMinutesAhead">Notify when estimated time is &lt; N minutes</Label>
              <Input id="notifyMinutesAhead" type="number" value={settings.notifyMinutesAhead} onChange={handleChange} />
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save size={16} className="mr-2" />Save Configurations</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
