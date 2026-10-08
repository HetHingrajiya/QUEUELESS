"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, User, Mail, Phone, MapPin, 
  Camera, CheckCircle2, ShieldCheck, Loader2 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "Heth Hingrajiya",
    email: "heth@queueless.gov.in",
    phone: "+91 98765 43210",
    dob: "1998-05-14",
    idNumber: "XXXX-XXXX-4912",
    address: "14 Neelkanth Nagar, University Road, Rajkot, Gujarat",
    pincode: "360005"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSaved(true);
      setTimeout(() => router.push('/citizen/profile'), 1500);
    }, 800);
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

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          {saved && (
            <div className="p-3 mb-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center">
              <CheckCircle2 size={16} className="mr-2 text-emerald-600" />
              Profile updated successfully! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Avatar Row */}
            <div className="flex items-center space-x-4 pb-2 border-b border-slate-100">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl">
                  {formData.fullName.charAt(0)}
                </div>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 bg-slate-900 text-white p-1 rounded-full shadow"
                  onClick={() => alert("Upload photo feature")}
                >
                  <Camera size={12} />
                </button>
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{formData.fullName}</p>
                <p className="text-slate-400 text-[11px]">Citizen ID Verified</p>
              </div>
            </div>

            <div>
              <Label className="text-xs text-slate-600">Full Legal Name</Label>
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="mt-1 h-10 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-600">Email Address</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 h-10 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-600">Mobile Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 h-10 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-600">Date of Birth</Label>
                <Input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="mt-1 h-10 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-600">Govt ID Reference</Label>
                <Input
                  disabled
                  value={formData.idNumber}
                  className="mt-1 h-10 text-xs bg-slate-50 text-slate-500"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-slate-600">Residential Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="mt-1 h-10 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-600">Postal Pincode</Label>
              <Input
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="mt-1 h-10 text-xs"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-xs font-bold"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-2" /> Saving Changes...
                  </>
                ) : (
                  'Save Profile Details'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
