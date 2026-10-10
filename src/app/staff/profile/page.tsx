"use client";
import { useEffect, useState } from 'react';
import { Loader2, User, Building2, MonitorDot, Shield, Mail } from 'lucide-react';

export interface StaffProfile {
  fullName: string;
  email: string;
  role: string;
}

export interface StaffDashboardData {
  office?: {
    name: string;
    organizationId?: {
      name: string;
    };
  };
  counter?: {
    name: string;
    number: string;
    serviceNames: string;
  };
}

export default function StaffProfilePage() {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [dashboard, setDashboard] = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [authRes, dashRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/staff/dashboard')
        ]);
        
        const authJson = await authRes.json();
        const dashJson = await dashRes.json();

        if (authJson.success) setProfile(authJson.data.user);
        if (dashJson.success) setDashboard(dashJson.data);
      } catch (err) {
        console.error("Failed to load profile data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh] cursor-default">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] cursor-default text-center">
        <div className="bg-background shadow-neu rounded-[2.5rem] p-12">
          <h2 className="text-xl font-black text-foreground mb-2">Profile Not Found</h2>
          <p className="text-sm font-bold text-muted-foreground">Failed to load your profile information.</p>
        </div>
      </div>
    );
  }

  const { counter, office } = dashboard || {};

  return (
    <div className="space-y-6 lg:space-y-8 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">My Profile</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold mt-1">Manage your account information and preferences.</p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-6 lg:space-y-8">
            <div className="bg-background shadow-neu rounded-[2.5rem] p-8 border-0 text-center">
              <div className="h-28 w-28 mx-auto rounded-[2rem] bg-background shadow-neu-inset flex items-center justify-center text-primary font-black text-5xl mb-6">
                {(profile.fullName || profile.email || '?').charAt(0).toUpperCase()}
              </div>
              <h3 className="text-2xl font-black text-foreground">{profile.fullName}</h3>
              <p className="text-xs font-bold text-muted-foreground mt-1 mb-6">{profile.email}</p>
              <div className="inline-flex items-center px-4 py-2 bg-background shadow-neu-inset rounded-xl">
                <Shield size={14} className="mr-2 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{profile.role}</span>
              </div>
            </div>

            <div className="bg-background shadow-neu rounded-[2.5rem] p-8 border-0">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6">Account Settings</h3>
               <div className="space-y-4">
                 <button className="w-full h-14 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl flex items-center px-6 transition-all border-0">
                    <Shield size={16} className="text-primary mr-4" />
                    <span className="text-xs font-black uppercase tracking-widest text-foreground">Change Password</span>
                 </button>
                 <button className="w-full h-14 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl flex items-center px-6 transition-all border-0">
                    <Mail size={16} className="text-primary mr-4" />
                    <span className="text-xs font-black uppercase tracking-widest text-foreground">Update Email</span>
                 </button>
               </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-7">
            <div className="bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0 h-full">
              
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 bg-background shadow-neu-inset rounded-2xl flex items-center justify-center text-blue-500 shrink-0">
                    <Building2 size={20} />
                 </div>
                 <div>
                    <h2 className="text-lg font-black text-foreground">Organization Details</h2>
                    <p className="text-xs font-bold text-muted-foreground mt-1">Your assigned office and counter information</p>
                 </div>
              </div>

              <div className="space-y-8">
                 <div className="bg-background shadow-neu-inset rounded-[2rem] p-6 sm:p-8">
                   <h3 className="text-sm font-black text-foreground flex items-center mb-6">
                      <Building2 size={16} className="text-blue-500 mr-2" />
                      Office Information
                   </h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Office Name</p>
                       <p className="text-sm font-bold text-foreground">{office?.name || 'Not Assigned'}</p>
                     </div>
                     <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Organization</p>
                       <p className="text-sm font-bold text-foreground">{office?.organizationId?.name || 'Not Assigned'}</p>
                     </div>
                   </div>
                 </div>

                 <div className="bg-background shadow-neu-inset rounded-[2rem] p-6 sm:p-8">
                   <h3 className="text-sm font-black text-foreground flex items-center mb-6">
                      <MonitorDot size={16} className="text-indigo-500 mr-2" />
                      Counter Assignment
                   </h3>
                   {counter ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Counter Name</p>
                         <p className="text-sm font-bold text-foreground">{counter.name}</p>
                       </div>
                       <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Counter Number</p>
                         <p className="text-sm font-bold text-foreground">{counter.number}</p>
                       </div>
                       <div className="sm:col-span-2">
                         <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Handled Services</p>
                         <p className="text-sm font-bold text-foreground leading-relaxed">{counter.serviceNames}</p>
                       </div>
                     </div>
                   ) : (
                     <div className="flex items-center text-amber-500">
                       <p className="text-sm font-black uppercase tracking-widest">You are not currently assigned to any counter.</p>
                     </div>
                   )}
                 </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
