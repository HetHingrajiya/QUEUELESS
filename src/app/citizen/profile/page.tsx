"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  User, Mail, Phone, Edit3, Settings, Shield, 
  LogOut, Heart, Clock, HelpCircle, MessageSquare, 
  Bell, ChevronRight, Lock 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';

export default function CitizenProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/citizen/profile');
        const json = await res.json();
        if (json.success && json.data) {
          setProfile(json.data);
        } else {
          // fallback to auth/me if profile api not yet warmed
          const meRes = await fetch('/api/auth/me');
          const meJson = await meRes.json();
          if (meJson.success && meJson.data?.user) {
            setProfile(meJson.data.user);
          }
        }
      } catch (error) {
        console.error('Failed to load profile', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);

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
      <div className="max-w-md mx-auto pt-4">
        <SkeletonLoader type="profile" />
      </div>
    );
  }

  const citizenName = profile?.name || profile?.fullName || 'Citizen User';
  const citizenEmail = profile?.email || 'citizen@queueless.gov';
  const citizenPhone = profile?.phone || profile?.mobile || 'Not registered';

  const menuItems = [
    { label: 'Edit Profile', href: '/citizen/profile/edit', icon: <Edit3 size={18} className="text-blue-600" /> },
    { label: 'Change Password', href: '/citizen/profile/change-password', icon: <Lock size={18} className="text-indigo-600" /> },
    { label: 'Account Settings', href: '/citizen/settings/account', icon: <Settings size={18} className="text-slate-600" /> },
    { label: 'Notification Settings', href: '/citizen/settings', icon: <Bell size={18} className="text-amber-600" /> },
    { label: 'Privacy Settings', href: '/citizen/settings/privacy', icon: <Shield size={18} className="text-emerald-600" /> },
    { label: 'Favorites', href: '/citizen/favorites', icon: <Heart size={18} className="text-rose-600" /> },
    { label: 'Token History', href: '/citizen/token-history', icon: <Clock size={18} className="text-cyan-600" /> },
    { label: 'Give Feedback', href: '/citizen/feedback', icon: <MessageSquare size={18} className="text-violet-600" /> },
    { label: 'Help & FAQ', href: '/citizen/help/faq', icon: <HelpCircle size={18} className="text-teal-600" /> },
  ];

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-2">
      {/* Header */}
      <div className="flex flex-col space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit">
          Screen 40 • Profile
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900">Citizen Profile</h1>
      </div>

      {/* Profile Card */}
      <Card className="border-slate-200 overflow-hidden shadow-sm bg-white">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 h-20" />
        <CardContent className="p-5 pt-0 relative">
          <div className="flex justify-between items-end mb-4">
            <div className="w-18 h-18 rounded-2xl bg-white p-1 shadow-md -mt-9 border-2 border-white">
              <div className="w-full h-full rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 font-extrabold text-2xl">
                {citizenName.charAt(0)}
              </div>
            </div>
            <Link href="/citizen/profile/edit">
              <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs">
                <Edit3 size={13} className="mr-1.5" /> Edit Profile
              </Button>
            </Link>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{citizenName}</h2>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                VERIFIED
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center">
              <Mail size={12} className="mr-1.5 text-slate-400" /> {citizenEmail}
            </p>
            <p className="text-xs text-slate-500 flex items-center">
              <Phone size={12} className="mr-1.5 text-slate-400" /> {citizenPhone}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Menu Options */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                {item.icon}
              </div>
              <span className="text-xs font-semibold text-slate-800">{item.label}</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </Link>
        ))}

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-3.5 text-red-600 hover:bg-red-50 transition-colors text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <LogOut size={18} className="text-red-600" />
            </div>
            <span className="text-xs font-semibold">Sign Out</span>
          </div>
          <ChevronRight size={16} className="text-red-400" />
        </button>
      </div>
    </div>
  );
}
