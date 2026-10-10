"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, MapPin, Database, CheckCircle2, ShieldCheck, AlertCircle, Shield, Settings2, Save
} from 'lucide-react';

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
      <div className="flex items-center mb-8">
        <Link href="/citizen/profile">
          <button className="w-12 h-12 mr-4 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-full transition-all text-muted-foreground hover:text-foreground shrink-0">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Privacy Settings</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold">Manage data sharing and security preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Column: Security Context */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-10 text-center border-0">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-8">Data Control</p>
            
            <div className="w-32 h-32 rounded-full mx-auto bg-background shadow-neu-inset flex items-center justify-center mb-6 text-primary">
              <Shield size={48} className="text-primary opacity-80" />
            </div>
            
            <h2 className="text-xl font-black text-foreground tracking-tight mb-8">Your Data, Your Rules</h2>
            
            <div className="bg-background shadow-neu-inset p-5 rounded-2xl border-2 border-primary/10 text-left">
              <Settings2 size={24} className="text-primary mb-3" />
              <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                Control exactly what data you share with the Queue system. We strictly use this data to improve predictive accuracy and physical flow.
              </p>
            </div>
          </div>

          <div className="bg-background shadow-neu rounded-[2rem] p-6 text-center border-0">
             <div className="w-14 h-14 rounded-2xl bg-background shadow-neu-inset flex items-center justify-center text-primary mx-auto mb-4">
                <MapPin size={24} />
             </div>
             <h3 className="font-bold text-sm text-foreground mb-1">Browser GPS Permission</h3>
             <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-4">Device Geofencing</p>
             <Link href="/citizen/permissions/location" className="block w-full">
               <button className="w-full h-12 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl text-xs uppercase font-black tracking-widest text-primary flex items-center justify-center transition-all">
                 Manage Device Access
               </button>
             </Link>
          </div>
        </div>

        {/* Right Column: Toggles */}
        <div className="lg:col-span-8">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-8 sm:p-10 border-0">
            
            {error && (
              <div className="p-4 mb-8 rounded-2xl bg-background shadow-neu-inset border-2 border-red-500/20 text-red-500 text-sm font-bold flex items-center">
                <AlertCircle size={18} className="mr-3" />
                {error}
              </div>
            )}

            <div className="space-y-6">
              
              {/* Location Tracking */}
              <div className="bg-background shadow-neu-inset hover:shadow-neu rounded-3xl p-6 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-0 group">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-xl bg-background shadow-neu flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-105">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-foreground mb-1">Geofence Location Sync</h3>
                    <p className="text-xs font-semibold text-muted-foreground leading-relaxed max-w-md">
                      Automatically verify venue presence without scanning office QR codes. Allows for predictive check-in.
                    </p>
                  </div>
                </div>
                <NeumorphicToggle checked={locationTracking} onChange={() => setLocationTracking(!locationTracking)} />
              </div>

              {/* Telemetry */}
              <div className="bg-background shadow-neu-inset hover:shadow-neu rounded-3xl p-6 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-0 group">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-xl bg-background shadow-neu flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-105">
                    <Database size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-foreground mb-1">Anonymous Queue AI Training</h3>
                    <p className="text-xs font-semibold text-muted-foreground leading-relaxed max-w-md">
                      Contribute wait-time durations anonymously to improve our Random Forest prediction models.
                    </p>
                  </div>
                </div>
                <NeumorphicToggle checked={telemetry} onChange={() => setTelemetry(!telemetry)} />
              </div>

              {/* Audit Visibility */}
              <div className="bg-background shadow-neu-inset hover:shadow-neu rounded-3xl p-6 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-0 group">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-xl bg-background shadow-neu flex items-center justify-center text-emerald-500 shrink-0 transition-transform group-hover:scale-105">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-foreground mb-1">Officer Audit Log Record</h3>
                    <p className="text-xs font-semibold text-muted-foreground leading-relaxed max-w-md">
                      Maintain a verifiable, encrypted digital trail of all token service milestones on your account.
                    </p>
                  </div>
                </div>
                <NeumorphicToggle checked={auditLogVisibility} onChange={() => setAuditLogVisibility(!auditLogVisibility)} />
              </div>

              <div className="pt-8 flex flex-col sm:flex-row items-center gap-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full sm:flex-1 h-16 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl text-sm uppercase font-black tracking-widest text-primary flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
