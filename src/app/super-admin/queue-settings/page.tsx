"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function QueueSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    enableAIPrediction: true,
    historicalWeight: 40,
    liveVelocityWeight: 60,
    maxDailyTokensPerUser: 3,
    maxConcurrentTokens: 1,
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
          enableAIPrediction: data.data.enableAIPrediction ?? true,
          historicalWeight: data.data.historicalWeight ?? 40,
          liveVelocityWeight: data.data.liveVelocityWeight ?? 60,
          maxDailyTokensPerUser: data.data.maxDailyTokensPerUser ?? 3,
          maxConcurrentTokens: data.data.maxConcurrentTokens ?? 1,
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
        alert('Queue Settings saved successfully');
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

  const handleSwitchChange = (checked: boolean) => {
    setSettings(prev => ({ ...prev, enableAIPrediction: checked }));
  };

  if (loading) {
    return <div className="p-6">Loading queue algorithms...</div>;
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Global Queue Algorithms</h2>
          <p className="text-sm text-slate-500">Configure core queue AI settings and limitations.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Prediction Engine</CardTitle>
          <CardDescription>Configure how wait times are calculated globally.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div>
              <Label className="text-base font-semibold">Enable AI Wait Time Prediction</Label>
              <p className="text-sm text-slate-500">Use machine learning to estimate wait times dynamically instead of static averages.</p>
            </div>
            <Switch checked={settings.enableAIPrediction} onCheckedChange={handleSwitchChange} />
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="historicalWeight">Historical Data Weight (%)</Label>
              <Input id="historicalWeight" type="number" value={settings.historicalWeight} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="liveVelocityWeight">Live Velocity Weight (%)</Label>
              <Input id="liveVelocityWeight" type="number" value={settings.liveVelocityWeight} onChange={handleChange} />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Token Generation Rules</CardTitle>
          <CardDescription>Configure limits on token generation algorithms.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="maxDailyTokensPerUser">Max Daily Tokens per User</Label>
              <Input id="maxDailyTokensPerUser" type="number" value={settings.maxDailyTokensPerUser} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxConcurrentTokens">Max Concurrent Active Tokens</Label>
              <Input id="maxConcurrentTokens" type="number" value={settings.maxConcurrentTokens} onChange={handleChange} />
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save size={16} className="mr-2" />Save Algorithms</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
