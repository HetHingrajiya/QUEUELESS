"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Key, Mail, Shield, Building2, MapPin, Phone, BadgeCheck } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({ fullName: '', mobile: '' });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        const data = await res.json();
        if (data.success) {
          setUser(data.data);
          setForm({ fullName: data.data.fullName || '', mobile: data.data.mobile || '' });
        } else {
          setError(data.message || 'Failed to load profile.');
        }
      } catch {
        setError('Network error.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        setSuccess('Profile updated successfully.');
      } else {
        setError(data.message || 'Failed to update profile.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!pwdForm.currentPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
      setError('All password fields are required.');
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setChangingPwd(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pwdForm),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Password changed successfully.');
        setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setError(data.message || 'Failed to change password.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setChangingPwd(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6 text-red-600 text-center">
            {error || 'Could not load profile.'}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">My Profile</h2>
        <p className="text-sm text-slate-500">Manage your account information and security.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded text-sm">{success}</div>
      )}

      {/* Identity Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl shrink-0">
              {user.fullName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <CardTitle>{user.fullName}</CardTitle>
              <p className="text-sm text-slate-500 flex items-center mt-1">
                <Shield size={14} className="mr-1 text-slate-400" /> {user.role}
                <span className={`ml-3 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                }`}>{user.status}</span>
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center text-slate-700 space-x-2">
              <Mail size={15} className="text-slate-400" />
              <span>{user.email}</span>
            </div>
            {user.mobile && (
              <div className="flex items-center text-slate-700 space-x-2">
                <Phone size={15} className="text-slate-400" />
                <span>{user.mobile}</span>
              </div>
            )}
            {user.organizationId?.name && (
              <div className="flex items-center text-slate-700 space-x-2">
                <Building2 size={15} className="text-slate-400" />
                <span>{user.organizationId.name}</span>
              </div>
            )}
            {user.officeId?.name && (
              <div className="flex items-center text-slate-700 space-x-2">
                <MapPin size={15} className="text-slate-400" />
                <span>{user.officeId.name}</span>
              </div>
            )}
            {user.employeeId && (
              <div className="flex items-center text-slate-700 space-x-2">
                <BadgeCheck size={15} className="text-slate-400" />
                <span>Employee ID: {user.employeeId}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>Update your display name and contact number.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name <span className="text-red-500">*</span></Label>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              placeholder="Your full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input
              id="mobile"
              value={form.mobile}
              onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
              placeholder="+91 XXXXXXXXXX"
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={saveProfile} disabled={saving || !form.fullName} className="bg-blue-600 hover:bg-blue-700">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save size={16} className="mr-2" /> Save Changes</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Key className="text-blue-600" size={18} />
            <CardTitle>Change Password</CardTitle>
          </div>
          <CardDescription>Your password must be at least 8 characters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={pwdForm.currentPassword}
              onChange={e => setPwdForm(f => ({ ...f, currentPassword: e.target.value }))}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={pwdForm.newPassword}
              onChange={e => setPwdForm(f => ({ ...f, newPassword: e.target.value }))}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={pwdForm.confirmPassword}
              onChange={e => setPwdForm(f => ({ ...f, confirmPassword: e.target.value }))}
              placeholder="••••••••"
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={changePassword} disabled={changingPwd} className="bg-blue-600 hover:bg-blue-700">
              {changingPwd ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Changing...</> : <><Key size={16} className="mr-2" /> Change Password</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
