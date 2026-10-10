"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, CheckCircle2, AlertCircle, Save,
  ShieldCheck, User
} from 'lucide-react';
import { LoadingState } from '@/components/common/LoadingState';

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/citizen/profile');
        const json = await res.json();
        if (json.success && json.data) {
          const u = json.data;
          setFormData({
            name: u.name || u.fullName || '',
            email: u.email || '',
            phone: u.phone || u.mobile || '',
            address: u.address || ''
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const res = await fetch('/api/citizen/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          address: formData.address
        })
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setTimeout(() => router.push('/citizen/profile'), 1200);
      } else {
        setError(json.message || 'Failed to update profile');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto pt-4">
        <LoadingState label="Loading profile data..." />
      </div>
    );
  }

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
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Edit Profile</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold">Update your personal information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Column: Avatar & Info */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-10 text-center border-0">
            <div className="w-32 h-32 rounded-full mx-auto bg-background shadow-neu-inset flex items-center justify-center mb-6 text-primary">
              <span className="text-5xl font-black">{formData.name ? formData.name.charAt(0) : 'C'}</span>
            </div>
            <h2 className="text-xl font-black text-foreground tracking-tight mb-2">{formData.name || 'Citizen'}</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-8">Primary Identity</p>
            
            <div className="bg-background shadow-neu-inset p-5 rounded-2xl border-2 border-emerald-500/10">
              <ShieldCheck size={24} className="text-emerald-500 mx-auto mb-3" />
              <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                Your data is encrypted and securely stored. We use this information solely for queue management and service delivery.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-8">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-8 sm:p-10 border-0">
            
            {saved && (
              <div className="p-4 mb-8 rounded-2xl bg-background shadow-neu-inset border-2 border-emerald-500/20 text-emerald-500 text-sm font-bold flex items-center">
                <CheckCircle2 size={18} className="mr-3" />
                Profile securely updated! Redirecting...
              </div>
            )}

            {error && (
              <div className="p-4 mb-8 rounded-2xl bg-background shadow-neu-inset border-2 border-red-500/20 text-red-500 text-sm font-bold flex items-center">
                <AlertCircle size={18} className="mr-3" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" />
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-14 pl-14 pr-5 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground/50 border-0 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Email Address <span className="text-amber-500 lowercase normal-case ml-1">(Read-Only)</span></label>
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full h-14 px-5 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-muted-foreground opacity-70 cursor-not-allowed border-0 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Phone Number</label>
                <input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full h-14 px-5 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground/50 border-0 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Residential Address</label>
                <textarea
                  rows={4}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter your full street address, city, district..."
                  className="w-full p-5 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground/50 border-0 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                />
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={saving || loading}
                  className="w-full h-16 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl text-sm uppercase font-black tracking-widest text-primary flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="flex items-center"><span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3"></span> Saving...</span>
                  ) : (
                    <span className="flex items-center"><Save size={18} className="mr-3" /> Save Changes</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
