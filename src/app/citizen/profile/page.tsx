"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mail, Phone, Edit3, Settings, Shield, 
  LogOut, Heart, Clock, HelpCircle, MessageSquare, 
  Bell, ChevronRight, Lock, Info 
} from 'lucide-react';
import Link from 'next/link';
import { LoadingState } from '@/components/common/LoadingState';
import { CitizenProfile, ApiResponse } from '@/types/citizen';

export default function CitizenProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CitizenProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/citizen/profile');
        const json: ApiResponse<CitizenProfile> = await res.json();
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
      } catch (error: unknown) {
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
      router.push('/login');
    } catch (e) {
      console.error(e);
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto pt-4">
        <LoadingState label="Loading your profile..." />
      </div>
    );
  }

  const citizenName = profile?.name || profile?.fullName || 'Citizen';
  const citizenEmail = profile?.email || 'Not available';
  const citizenPhone = profile?.phone || profile?.mobile || 'Not available';

  const menuSections = [
    {
      title: 'Activity & Alerts',
      items: [
        { label: 'Token History', href: '/citizen/token-history', icon: <Clock size={20} className="text-primary" /> },
        { label: 'Favorite Hubs', href: '/citizen/favorites', icon: <Heart size={20} className="text-primary" /> },
        { label: 'Notifications', href: '/citizen/notifications', icon: <Bell size={20} className="text-primary" /> },
      ]
    },
    {
      title: 'Account Settings',
      items: [
        { label: 'Personal Information', href: '/citizen/profile/edit', icon: <Edit3 size={20} className="text-muted-foreground" /> },
        { label: 'Change Password', href: '/citizen/profile/change-password', icon: <Lock size={20} className="text-muted-foreground" /> },
        { label: 'Privacy & Security', href: '/citizen/settings/privacy', icon: <Shield size={20} className="text-muted-foreground" /> },
      ]
    },
    {
      title: 'Support & Help',
      items: [
        { label: 'Help & FAQ', href: '/citizen/help', icon: <HelpCircle size={20} className="text-primary" /> },
        { label: 'Give Feedback', href: '/citizen/feedback', icon: <MessageSquare size={20} className="text-primary" /> },
        { label: 'About SamaySetu', href: '/citizen/about', icon: <Info size={20} className="text-muted-foreground" /> },
      ]
    }
  ];

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      {/* Header */}
      <div className="flex flex-col space-y-2 mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Citizen Profile</h1>
        <p className="text-muted-foreground text-xs sm:text-sm font-semibold">Manage your account, preferences, and security.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Column: ID Card */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-10 text-center border-0">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-8">Digital Identity</p>
            
            <div className="w-32 h-32 rounded-full mx-auto bg-background shadow-neu-inset flex items-center justify-center mb-6">
              <span className="text-5xl font-black text-primary">{citizenName.charAt(0)}</span>
            </div>
            
            <h2 className="text-xl font-black text-foreground tracking-tight mb-2">{citizenName}</h2>
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-background shadow-neu text-emerald-500 mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {profile?.status === 'ACTIVE' ? 'ACTIVE' : profile?.status === 'INACTIVE' ? 'INACTIVE' : 'STATUS UNKNOWN'}
            </div>

            <div className="space-y-4 text-left bg-background shadow-neu-inset p-6 rounded-3xl">
              <div className="flex items-center text-sm">
                <Mail size={16} className="text-primary mr-4 shrink-0" />
                <span className="font-bold text-foreground truncate">{citizenEmail}</span>
              </div>
              <div className="flex items-center text-sm">
                <Phone size={16} className="text-primary mr-4 shrink-0" />
                <span className="font-bold text-foreground">{citizenPhone}</span>
              </div>
            </div>

            <Link href="/citizen/profile/edit" className="block mt-8">
              <button className="w-full h-14 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl text-xs uppercase font-black tracking-widest text-primary flex items-center justify-center transition-all">
                <Edit3 size={16} className="mr-2" /> Edit Profile
              </button>
            </Link>
          </div>

          <button
            onClick={handleLogout}
            className="w-full h-16 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-[2rem] text-sm uppercase font-black tracking-widest text-red-500 flex items-center justify-center transition-all"
          >
            <LogOut size={20} className="mr-3" /> Sign Out
          </button>
        </div>

        {/* Right Column: Menu Sections */}
        <div className="lg:col-span-7 space-y-8">
          {menuSections.map((section, idx) => (
            <div key={idx} className="bg-background shadow-neu rounded-[2rem] p-6 sm:p-8">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-6 px-2">
                {section.title}
              </h3>
              <div className="space-y-3">
                {section.items.map((item, itemIdx) => (
                  <Link
                    key={itemIdx}
                    href={item.href}
                    className="flex items-center justify-between p-5 bg-background shadow-neu-inset hover:shadow-neu rounded-2xl transition-all group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl bg-background shadow-neu flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                        {item.icon}
                      </div>
                      <span className="text-sm font-extrabold text-foreground tracking-wide">{item.label}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-background shadow-neu flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={16} className="text-primary" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
