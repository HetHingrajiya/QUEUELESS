"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Globe, Moon, Fingerprint, 
  Trash2, Download, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AccountSettingsPage() {
  const router = useRouter();
  const [language, setLanguage] = useState('en');
  const [biometric, setBiometric] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/citizen/profile');
        const json = await res.json();
        if (json.success && json.data?.settings) {
          const s = json.data.settings;
          if (s.language) setLanguage(s.language);
          if (s.biometric !== undefined) setBiometric(s.biometric);
          if (s.darkMode !== undefined) setDarkMode(s.darkMode);
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
            language,
            biometric,
            darkMode
          }
        })
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        setError(json.message || 'Failed to save settings');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to deactivate your QueueLess Citizen account? This action will invalidate active queue passes.")) return;
    try {
      setDeleting(true);
      const res = await fetch('/api/citizen/profile', { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        alert("Your account has been deactivated.");
        window.location.href = '/login';
      } else {
        alert(json.message || "Failed to deactivate account.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while deactivating account.");
    } finally {
      setDeleting(false);
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
              Screen 43 • Account
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">Account Settings</h1>
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
          {/* Language Selection */}
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Globe size={18} />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">App Language</p>
                <p className="text-slate-400">Select interface language</p>
              </div>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700"
            >
              <option value="en">English (US)</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="gu">ગુજરાતી (Gujarati)</option>
            </select>
          </div>

          {/* Biometrics */}
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Fingerprint size={18} />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">Biometric Fast Login</p>
                <p className="text-slate-400">Fingerprint or Face Unlock</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={biometric}
                onChange={() => setBiometric(!biometric)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Dark Mode */}
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Moon size={18} />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">Appearance Mode</p>
                <p className="text-slate-400">System Light / Dark theme</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Account Data & Danger Zone */}
      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0 divide-y divide-slate-100 text-xs">
          <button
            onClick={() => {
              window.open('/api/citizen/token-history', '_blank');
            }}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 text-left transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Download size={16} className="text-slate-500" />
              <span className="font-medium text-slate-700">Export My Queue Data (JSON)</span>
            </div>
          </button>

          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="w-full p-4 flex items-center justify-between hover:bg-red-50 text-left text-red-600 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Trash2 size={16} />
              <span className="font-medium">{deleting ? 'Deactivating...' : 'Delete / Deactivate Citizen Account'}</span>
            </div>
          </button>
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-bold text-xs"
      >
        {saving ? 'Saving Preferences...' : 'Save Account Preferences'}
      </Button>

      {saved && (
        <p className="text-center text-xs text-emerald-600 font-semibold flex items-center justify-center">
          <CheckCircle2 size={14} className="mr-1.5" /> Preferences saved in MongoDB!
        </p>
      )}
    </div>
  );
}
