"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock, ShieldCheck, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function CitizenChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = calculateStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!currentPassword) {
      setStatus({ type: 'error', message: 'Please enter your current password.' });
      return;
    }
    if (newPassword.length < 8) {
      setStatus({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: 'success', message: 'Password changed successfully! Keep your credentials safe.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setStatus({ type: 'error', message: data.message || 'Failed to update password. Verify current password.' });
      }
    } catch (err: unknown) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Network error occurred while updating password. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Security Center</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold">Change your password and secure your account.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Column: Security Information */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-10 text-center border-0">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-8">Data Privacy</p>
            
            <div className="w-32 h-32 rounded-full mx-auto bg-background shadow-neu-inset flex items-center justify-center mb-6 text-primary">
              <Lock size={48} className="text-primary opacity-80" />
            </div>
            
            <h2 className="text-xl font-black text-foreground tracking-tight mb-8">Account Security</h2>
            
            <div className="bg-background shadow-neu-inset p-5 rounded-2xl border-2 border-emerald-500/10">
              <ShieldCheck size={24} className="text-emerald-500 mx-auto mb-3" />
              <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                Passwords must contain a combination of letters, numbers, and symbols to ensure maximum security of your citizen records.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Password Form */}
        <div className="lg:col-span-8">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-8 sm:p-10 border-0">
            
            {status && (
              <div className={`p-4 mb-8 rounded-2xl bg-background shadow-neu-inset border-2 text-sm font-bold flex items-center ${
                status.type === 'success' ? 'border-emerald-500/20 text-emerald-500' : 'border-red-500/20 text-red-500'
              }`}>
                {status.type === 'success' ? (
                  <CheckCircle2 size={18} className="mr-3 shrink-0" />
                ) : (
                  <AlertCircle size={18} className="mr-3 shrink-0" />
                )}
                {status.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full h-14 px-5 pr-14 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground/50 border-0 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background shadow-neu flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-muted/10 space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-14 px-5 pr-14 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground/50 border-0 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background shadow-neu flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                {/* Physical Password strength meter */}
                {newPassword && (
                  <div className="mt-4 px-4 flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {strength <= 1 && 'Weak'}
                      {strength === 2 && 'Fair'}
                      {strength === 3 && 'Good'}
                      {strength === 4 && 'Strong'}
                    </p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`w-8 h-2 rounded-full transition-all duration-300 ${
                            strength >= i
                              ? strength <= 2
                                ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                                : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                              : 'bg-background shadow-neu-inset'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-14 px-5 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground/50 border-0 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Re-enter new password"
                />
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full h-16 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl text-sm uppercase font-black tracking-widest text-primary flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center"><span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3"></span> Updating...</span>
                  ) : (
                    <span className="flex items-center"><Lock size={18} className="mr-3" /> Update Password</span>
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
