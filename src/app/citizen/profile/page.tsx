"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, User, Mail, Phone, Edit3, Settings, Shield, LogOut, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function CitizenProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const json = await res.json();
        if (json.success && json.data?.user) {
          setProfile(json.data.user);
          setFormData({
            fullName: json.data.user.fullName || '',
            email: json.data.user.email || '',
            mobile: json.data.user.mobile || ''
          });
        }
      } catch (error) {
        console.error('Failed to load profile', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        setProfile(json.data.user);
        setEditing(false);
      } else {
        alert(json.message || 'Failed to update profile');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (e) {
      console.error(e);
      window.location.href = '/login';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <User size={48} className="text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Profile Not Found</h2>
        <p className="text-slate-500 mb-6">We couldn't load your profile information. Please log in again.</p>
        <Button onClick={() => window.location.href = '/login'}>Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-md mx-auto">
      <div className="flex flex-col space-y-2 mb-6">
        <h2 className="text-2xl font-extrabold text-slate-800">My Profile</h2>
      </div>

      <Card className="border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-24"></div>
        <CardContent className="p-6 relative pt-0">
          <div className="flex justify-between items-end mb-6">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg -mt-10 border-4 border-white">
              <User size={32} className="text-slate-400" />
            </div>
            {!editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                <Edit3 size={14} className="mr-1.5" /> Edit
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
                <Button size="sm" onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </Button>
              </div>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="text-slate-500 text-xs">Full Name</Label>
                <Input 
                  id="fullName" 
                  value={formData.fullName} 
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
                  className="mt-1 bg-slate-50 border-slate-200"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-slate-500 text-xs">Email</Label>
                <Input 
                  id="email" 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  className="mt-1 bg-slate-50 border-slate-200"
                />
              </div>
              <div>
                <Label htmlFor="mobile" className="text-slate-500 text-xs">Phone Number</Label>
                <Input 
                  id="mobile" 
                  value={formData.mobile} 
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})} 
                  className="mt-1 bg-slate-50 border-slate-200"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{profile.fullName}</h3>
                <p className="text-sm text-slate-500">Citizen</p>
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="flex items-center text-slate-700 text-sm">
                  <Mail size={16} className="text-slate-400 mr-3 shrink-0" />
                  {profile.email}
                </div>
                <div className="flex items-center text-slate-700 text-sm">
                  <Phone size={16} className="text-slate-400 mr-3 shrink-0" />
                  {profile.mobile || <span className="text-slate-400 italic">Not provided</span>}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-2">Account</h3>
        
        <Link href="/citizen/settings" className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
          <div className="flex items-center text-slate-700 font-medium">
            <Settings size={18} className="text-slate-400 mr-3" />
            Notification Settings
          </div>
        </Link>
        
        <Link href="/citizen/help" className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
          <div className="flex items-center text-slate-700 font-medium">
            <Shield size={18} className="text-slate-400 mr-3" />
            Help & Support
          </div>
        </Link>

        <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-red-100 hover:bg-red-50 transition-colors">
          <div className="flex items-center text-red-600 font-medium">
            <LogOut size={18} className="mr-3" />
            Sign Out
          </div>
        </button>
      </div>
    </div>
  );
}
