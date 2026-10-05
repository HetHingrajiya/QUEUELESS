"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Users, Settings2 } from 'lucide-react';

export default function QueueSettingsPage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [globalDefaults, setGlobalDefaults] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    maxQueueSize: '',
    noShowTimeout: '',
    checkInBuffer: '',
  });

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch Global System Settings for placeholders/defaults
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
              maxQueueSize: settings.maxQueueSize || '',
              noShowTimeout: settings.noShowTimeout || '',
              checkInBuffer: settings.checkInBuffer || '',
            });
          }
        }
      } catch (error) {
        console.error('Failed to load queue settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initialize();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSave = async () => {
    if (!orgId) return;
    
    try {
      setSaving(true);
      
      // Construct settings object, omitting empty fields
      const settingsToUpdate: any = {};
      settingsToUpdate.maxQueueSize = formData.maxQueueSize ? parseInt(formData.maxQueueSize) : null;
      settingsToUpdate.noShowTimeout = formData.noShowTimeout ? parseInt(formData.noShowTimeout) : null;
      settingsToUpdate.checkInBuffer = formData.checkInBuffer ? parseInt(formData.checkInBuffer) : null;

      const res = await fetch(`/api/organizations/${orgId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsToUpdate })
      });
      
      const data = await res.json();
      if (data.success) {
        alert('Queue settings updated successfully.');
      } else {
        alert(data.message || 'Failed to update queue settings.');
      }
    } catch (error) {
      console.error('Error saving queue settings:', error);
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

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Queue Settings</h2>
          <p className="text-sm text-slate-500">Configure custom queue behavior for your organization.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Settings2 className="text-blue-600" size={20} />
            <CardTitle>Organization Overrides</CardTitle>
          </div>
          <CardDescription>
            Leave fields empty to use the platform's global default settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="maxQueueSize">Maximum Queue Size</Label>
              <Input 
                id="maxQueueSize" 
                type="number"
                value={formData.maxQueueSize} 
                onChange={handleChange} 
                placeholder={`Global Default: ${globalDefaults?.maxQueueSize || 100}`}
              />
              <p className="text-xs text-slate-500">Maximum number of citizens allowed in a single queue.</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="noShowTimeout">No-show Timeout (minutes)</Label>
              <Input 
                id="noShowTimeout" 
                type="number"
                value={formData.noShowTimeout} 
                onChange={handleChange} 
                placeholder={`Global Default: ${globalDefaults?.noShowTimeout || 5}`}
              />
              <p className="text-xs text-slate-500">How long to wait before marking a missing citizen as no-show.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkInBuffer">Check-in Buffer (minutes)</Label>
              <Input 
                id="checkInBuffer" 
                type="number"
                value={formData.checkInBuffer} 
                onChange={handleChange} 
                placeholder={`Global Default: ${globalDefaults?.checkInBuffer || 15}`}
              />
              <p className="text-xs text-slate-500">How early a citizen can check-in prior to their estimated time.</p>
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
                <><Save size={16} className="mr-2" /> Save Queue Settings</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
