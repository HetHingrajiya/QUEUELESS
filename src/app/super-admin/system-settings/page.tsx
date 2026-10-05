"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SystemSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    maxQueueSize: 100,
    noShowTimeout: 5,
    checkInBuffer: 15,
    aiRefreshRate: 30,
    sessionTimeout: 120,
    passwordExpiry: 90,
  });

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/system-settings');
      const data = await res.json();
      if (data.success && data.data) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

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
        alert('Settings saved successfully');
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

  if (loading) {
    return <div className="p-6">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">System Settings</h2>
          <p className="text-sm text-slate-500">Configure global QueueLess parameters.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Queue Configuration</CardTitle>
          <CardDescription>Global defaults for queue behavior across all organizations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="maxQueueSize">Maximum Queue Size per Counter</Label>
              <Input id="maxQueueSize" type="number" value={settings.maxQueueSize} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="noShowTimeout">No-show Timeout (minutes)</Label>
              <Input id="noShowTimeout" type="number" value={settings.noShowTimeout} onChange={handleChange} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="checkInBuffer">Check-in Buffer (minutes)</Label>
              <Input id="checkInBuffer" type="number" value={settings.checkInBuffer} onChange={handleChange} />
              <p className="text-xs text-slate-500">How early a citizen can check in before estimated turn.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="aiRefreshRate">AI Prediction Refresh Rate (seconds)</Label>
              <Input id="aiRefreshRate" type="number" value={settings.aiRefreshRate} onChange={handleChange} />
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button onClick={() => handleSave()} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              <Save size={16} className="mr-2" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>Manage platform security policies.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input id="sessionTimeout" type="number" value={settings.sessionTimeout} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
              <Input id="passwordExpiry" type="number" value={settings.passwordExpiry} onChange={handleChange} />
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button onClick={() => handleSave()} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              <Save size={16} className="mr-2" />
              Save Security
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
