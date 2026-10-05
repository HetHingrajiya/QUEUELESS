"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Bell } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export default function NotificationsSettingsPage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [globalDefaults, setGlobalDefaults] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    smsEnabled: null as boolean | null,
    emailEnabled: null as boolean | null,
  });

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch Global System Settings
        const sysRes = await fetch('/api/system-settings');
        const sysData = await sysRes.json();
        if (sysData.success) {
          setGlobalDefaults(sysData.data);
        }

        // 2. Fetch User & Organization
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        
        if (userData.success && userData.data?.user?.organizationId) {
          const organizationId = userData.data.user.organizationId;
          setOrgId(organizationId);
          
          const orgRes = await fetch(`/api/organizations/${organizationId}`);
          const orgData = await orgRes.json();
          
          if (orgData.success) {
            const settings = orgData.data.settings || {};
            setFormData({
              smsEnabled: settings.smsEnabled !== undefined ? settings.smsEnabled : null,
              emailEnabled: settings.emailEnabled !== undefined ? settings.emailEnabled : null,
            });
          }
        }
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initialize();
  }, []);

  const handleToggle = (key: string, currentValue: boolean | null) => {
    setFormData(prev => ({
      ...prev,
      [key]: currentValue === null ? !(globalDefaults?.[key]) : !currentValue
    }));
  };

  const handleReset = (key: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: null
    }));
  };

  const handleSave = async () => {
    if (!orgId) return;
    
    try {
      setSaving(true);
      
      const settingsToUpdate: any = {};
      // If they are not null, they are explicitly overridden
      if (formData.smsEnabled !== null) settingsToUpdate.smsEnabled = formData.smsEnabled;
      if (formData.emailEnabled !== null) settingsToUpdate.emailEnabled = formData.emailEnabled;

      const res = await fetch(`/api/organizations/${orgId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsToUpdate })
      });
      
      const data = await res.json();
      if (data.success) {
        alert('Notification settings updated successfully.');
      } else {
        alert(data.message || 'Failed to update notification settings.');
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      alert('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  // Display value: if local override is null, use global default, else use override.
  const displaySms = formData.smsEnabled !== null ? formData.smsEnabled : (globalDefaults?.smsEnabled ?? true);
  const displayEmail = formData.emailEnabled !== null ? formData.emailEnabled : (globalDefaults?.emailEnabled ?? true);

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Notification Settings</h2>
          <p className="text-sm text-slate-500">Configure how citizens receive alerts and updates.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Bell className="text-blue-600" size={20} />
            <CardTitle>Communication Channels</CardTitle>
          </div>
          <CardDescription>
            Enable or disable specific communication channels for your organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
              <div className="space-y-0.5">
                <Label className="text-base">SMS Notifications</Label>
                <p className="text-sm text-slate-500">Send waitlist updates via text message.</p>
                {formData.smsEnabled !== null && (
                  <button onClick={() => handleReset('smsEnabled')} className="text-xs text-blue-600 hover:underline">
                    Reset to global default ({globalDefaults?.smsEnabled ? 'Enabled' : 'Disabled'})
                  </button>
                )}
              </div>
              <Switch 
                checked={displaySms} 
                onCheckedChange={() => handleToggle('smsEnabled', formData.smsEnabled)} 
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
              <div className="space-y-0.5">
                <Label className="text-base">Email Notifications</Label>
                <p className="text-sm text-slate-500">Send queue tickets and receipts via email.</p>
                {formData.emailEnabled !== null && (
                  <button onClick={() => handleReset('emailEnabled')} className="text-xs text-blue-600 hover:underline">
                    Reset to global default ({globalDefaults?.emailEnabled ? 'Enabled' : 'Disabled'})
                  </button>
                )}
              </div>
              <Switch 
                checked={displayEmail} 
                onCheckedChange={() => handleToggle('emailEnabled', formData.emailEnabled)} 
              />
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={saving} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save size={16} className="mr-2" /> Save Notification Settings</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
