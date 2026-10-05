"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ShieldCheck, Clock, Key } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function SecuritySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [globalDefaults, setGlobalDefaults] = useState<any>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        const sysRes = await fetch('/api/system-settings');
        const sysData = await sysRes.json();
        if (sysData.success) {
          setGlobalDefaults(sysData.data);
        }
      } catch (error) {
        console.error('Failed to load security settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initialize();
  }, []);

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
          <h2 className="text-2xl font-bold text-slate-800">Security Policies</h2>
          <p className="text-sm text-slate-500">View the platform-wide security rules enforced by the Super Admin.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="text-green-600" size={20} />
            <CardTitle>Global Security Rules</CardTitle>
          </div>
          <CardDescription>
            These settings are managed by the platform owner and apply to all organizations automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 p-4 border rounded-lg bg-slate-50">
              <div className="flex items-center space-x-2 text-slate-700 font-semibold mb-2">
                <Clock size={16} />
                <Label>Session Timeout</Label>
              </div>
              <p className="text-2xl font-bold text-slate-800">
                {globalDefaults?.sessionTimeout || 120} <span className="text-sm font-normal text-slate-500">minutes</span>
              </p>
              <p className="text-xs text-slate-500">Users are automatically logged out after this period of inactivity.</p>
            </div>
            
            <div className="space-y-2 p-4 border rounded-lg bg-slate-50">
              <div className="flex items-center space-x-2 text-slate-700 font-semibold mb-2">
                <Key size={16} />
                <Label>Password Expiry</Label>
              </div>
              <p className="text-2xl font-bold text-slate-800">
                {globalDefaults?.passwordExpiry || 90} <span className="text-sm font-normal text-slate-500">days</span>
              </p>
              <p className="text-xs text-slate-500">Staff members are required to change their password on this interval.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
