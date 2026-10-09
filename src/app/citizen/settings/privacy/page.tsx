"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, MapPin, Database, CheckCircle2, ShieldCheck, AlertCircle 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PrivacySettingsPage() {
  const [locationTracking, setLocationTracking] = useState(true);
  const [telemetry, setTelemetry] = useState(false);
  const [auditLogVisibility, setAuditLogVisibility] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/citizen/profile');
        const json = await res.json();
        if (json.success && json.data?.settings?.privacy) {
          const p = json.data.settings.privacy;
          if (p.locationTracking !== undefined) setLocationTracking(p.locationTracking);
          if (p.telemetry !== undefined) setTelemetry(p.telemetry);
          if (p.auditLogVisibility !== undefined) setAuditLogVisibility(p.auditLogVisibility);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const res = await fetch('/api/citizen/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            privacy: {
              locationTracking,
              telemetry,
              auditLogVisibility
            }
          }
        })
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        setError(json.message || 'Failed to update privacy preferences');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Link href="/citizen/profile" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Screen 45 • Privacy
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">Privacy Settings</h1>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" /> {error}
        </div>
      )}

      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0 divide-y divide-slate-100 text-xs">
          {/* Location Tracking */}
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <MapPin size={18} />
              </div>
              <div className="max-w-[220px]">
                <p className="font-bold text-slate-800 text-sm">Geofence Location Sync</p>
                <p className="text-slate-400 text-[11px] mt-0.5 leading-snug">
                  Automatically verify venue presence without scanning office QR code.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={locationTracking}
                onChange={() => setLocationTracking(!locationTracking)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Telemetry */}
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Database size={18} />
              </div>
              <div className="max-w-[220px]">
                <p className="font-bold text-slate-800 text-sm">Anonymous Queue AI Training</p>
                <p className="text-slate-400 text-[11px] mt-0.5 leading-snug">
                  Contribute wait-time durations anonymously to improve AI prediction models.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={telemetry}
                onChange={() => setTelemetry(!telemetry)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Audit Visibility */}
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <div className="max-w-[220px]">
                <p className="font-bold text-slate-800 text-sm">Officer Audit Log Record</p>
                <p className="text-slate-400 text-[11px] mt-0.5 leading-snug">
                  Maintain verifiable encrypted digital trail of token service milestones.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={auditLogVisibility}
                onChange={() => setAuditLogVisibility(!auditLogVisibility)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-bold text-xs"
      >
        {saving ? 'Updating Settings...' : 'Update Privacy Preferences'}
      </Button>

      {saved && (
        <p className="text-center text-xs text-emerald-600 font-semibold flex items-center justify-center">
          <CheckCircle2 size={14} className="mr-1.5" /> Privacy settings saved in MongoDB!
        </p>
      )}
    </div>
  );
}
