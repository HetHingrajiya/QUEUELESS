"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, User, Mail, Phone, MapPin, 
  CheckCircle2, AlertCircle 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    } catch (err: any) {
      setError(err.message || 'Update error');
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
              Screen 41 • Profile
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">Edit Profile</h1>
          </div>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm bg-white">
        <CardContent className="p-6">
          {saved && (
            <div className="p-3 mb-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center">
              <CheckCircle2 size={16} className="mr-2 text-emerald-600" />
              Profile updated in MongoDB! Returning to profile...
            </div>
          )}

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-800 border border-red-200 text-xs flex items-center">
              <AlertCircle size={16} className="mr-2 text-red-600" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Avatar Row */}
            <div className="flex items-center space-x-4 pb-2 border-b border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl">
                {formData.name ? formData.name.charAt(0) : 'C'}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{formData.name || 'Citizen'}</p>
                <p className="text-slate-400 text-[11px]">Primary Citizen Identity</p>
              </div>
            </div>

            <div>
              <Label className="text-xs text-slate-600">Full Name</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 h-10 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-600">Email Address (Read-Only)</Label>
              <Input
                type="email"
                disabled
                value={formData.email}
                className="mt-1 h-10 text-xs bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-600">Phone Number</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 h-10 text-xs"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-600">Residential Address</Label>
              <textarea
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter street address, city, district..."
                className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <Button
              type="submit"
              disabled={saving || loading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              {saving ? 'Saving to Database...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
