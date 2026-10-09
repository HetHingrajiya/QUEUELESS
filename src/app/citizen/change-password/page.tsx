"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock, ShieldCheck, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Link href="/citizen/profile" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Screen 08 • Authentication
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-1">Change Password</h1>
          </div>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Lock size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm">Security & Privacy</h3>
            <p className="text-xs text-blue-100">Ensure your new password is secure and unique</p>
          </div>
        </div>

        <CardContent className="p-6">
          {status && (
            <div
              className={`p-4 rounded-xl mb-6 flex items-start text-sm ${
                status.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle2 size={18} className="mr-2 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={18} className="mr-2 text-red-600 shrink-0 mt-0.5" />
              )}
              <span>{status.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Current Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">New Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showNew ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password strength meter */}
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1 h-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all ${
                          strength >= i
                            ? strength <= 2
                              ? 'bg-amber-400'
                              : 'bg-emerald-500'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {strength <= 1 && 'Weak password'}
                    {strength === 2 && 'Fair password'}
                    {strength === 3 && 'Good password'}
                    {strength === 4 && 'Strong password'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Confirm New Password</Label>
              <Input
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 h-11 font-semibold text-sm shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" /> Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="bg-slate-100 rounded-xl p-4 text-xs text-slate-600 flex items-start space-x-3">
        <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <p>
          Passwords must contain a combination of letters, numbers, and symbols to ensure maximum security of your citizen records.
        </p>
      </div>
    </div>
  );
}
