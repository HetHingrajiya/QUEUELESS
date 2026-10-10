"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Loader2, Settings, Zap, Clock, Users, Database } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
        // success
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
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

  const handleSwitchChange = (val: boolean) => {
    setSettings(prev => ({ ...prev, enableAIPrediction: val }));
  };

  if (loading) {
    return <div className="p-6">Loading queue algorithms...</div>;
  }

  return (
    <div className="space-y-6 lg:space-y-8 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Global Queue Algorithms</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold mt-1">Configure core queue AI settings and limitations.</p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 space-y-6 lg:space-y-8 max-w-3xl">
        <div className="bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0">
          <div className="flex items-center gap-4 mb-8">
             <div className="w-12 h-12 bg-background shadow-neu-inset rounded-2xl flex items-center justify-center text-primary shrink-0">
                <Zap size={20} />
             </div>
             <div>
                <h2 className="text-lg font-black text-foreground">AI Prediction Engine</h2>
                <p className="text-xs font-bold text-muted-foreground mt-1">Configure how wait times are calculated globally</p>
             </div>
          </div>

          <div className="space-y-8">
             <div className="bg-background shadow-neu-inset rounded-[1.5rem] p-6 flex items-center justify-between gap-4">
                <div>
                   <h3 className="text-sm font-black text-foreground">Enable AI Wait Time Prediction</h3>
                   <p className="text-xs font-bold text-muted-foreground mt-1">Use machine learning to estimate wait times dynamically instead of static averages.</p>
                </div>
                <button 
                  onClick={() => handleSwitchChange(!settings.enableAIPrediction)}
                  className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:ring-offset-background border-0 shadow-neu-inset ${settings.enableAIPrediction ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'}`}
                >
                   <span className={`pointer-events-none absolute left-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 transition-transform ${settings.enableAIPrediction ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Historical Data Weight (%)</label>
                   <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                         <Database size={16} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
                      </div>
                      <input 
                         type="number"
                         id="historicalWeight"
                         value={settings.historicalWeight}
                         onChange={handleChange}
                         className="w-full h-14 pl-12 pr-4 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0"
                      />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Live Velocity Weight (%)</label>
                   <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                         <Clock size={16} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
                      </div>
                      <input 
                         type="number"
                         id="liveVelocityWeight"
                         value={settings.liveVelocityWeight}
                         onChange={handleChange}
                         className="w-full h-14 pl-12 pr-4 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0"
                      />
                   </div>
                </div>
             </div>
          </div>
        </div>

        <div className="bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0">
          <div className="flex items-center gap-4 mb-8">
             <div className="w-12 h-12 bg-background shadow-neu-inset rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
                <Settings size={20} />
             </div>
             <div>
                <h2 className="text-lg font-black text-foreground">Token Generation Rules</h2>
                <p className="text-xs font-bold text-muted-foreground mt-1">Configure limits on token generation algorithms</p>
             </div>
          </div>

          <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Max Daily Tokens per User</label>
                   <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                         <Users size={16} className="text-muted-foreground group-focus-within:text-amber-500 transition-colors" />
                      </div>
                      <input 
                         type="number"
                         id="maxDailyTokensPerUser"
                         value={settings.maxDailyTokensPerUser}
                         onChange={handleChange}
                         className="w-full h-14 pl-12 pr-4 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all border-0"
                      />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Max Concurrent Active Tokens</label>
                   <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                         <Users size={16} className="text-muted-foreground group-focus-within:text-amber-500 transition-colors" />
                      </div>
                      <input 
                         type="number"
                         id="maxConcurrentTokens"
                         value={settings.maxConcurrentTokens}
                         onChange={handleChange}
                         className="w-full h-14 pl-12 pr-4 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all border-0"
                      />
                   </div>
                </div>
             </div>
          </div>
        </div>

        <div className="flex justify-center md:justify-end">
           <button 
             onClick={handleSave} 
             disabled={saving}
             className="w-full md:w-auto h-14 px-10 bg-primary shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 rounded-2xl text-xs uppercase font-black tracking-widest text-primary-foreground flex items-center justify-center transition-all border-0 disabled:opacity-50 disabled:hover:translate-y-0"
           >
             {saving ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Save size={18} className="mr-2" />}
             SAVE ALGORITHMS
           </button>
        </div>
      </div>
    </div>
  );
}
