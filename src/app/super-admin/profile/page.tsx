// This profile queries the authenticated user and live MongoDB data per request.
export const dynamic = 'force-dynamic';

import { User, Mail, Shield, Building2, MapPin } from 'lucide-react';
import dbConnect from '@/lib/db';
import { User as UserModel } from '@/models/User';
import { getUserFromCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  await dbConnect();
  
  const authUser = await getUserFromCookie();
  if (!authUser) {
    redirect('/login');
  }

  const user = await UserModel.findById(authUser.userId)
    .populate('organizationId')
    .populate('officeId')
    .lean();

  if (!user) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="bg-background shadow-neu-inset rounded-[2rem] p-12 text-center text-muted-foreground font-bold text-sm">
          User not found
        </div>
      </div>
    );
  }

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
        <div className="bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0 max-w-3xl">
          
          <div className="flex items-center gap-4 mb-8">
             <div className="w-12 h-12 bg-background shadow-neu-inset rounded-2xl flex items-center justify-center text-primary shrink-0">
                <User size={20} />
             </div>
             <div>
                <h2 className="text-lg font-black text-foreground">Personal Information</h2>
                <p className="text-xs font-bold text-muted-foreground mt-1">Your personal details and contact info</p>
             </div>
          </div>

          <div className="space-y-8">
             <div className="bg-background shadow-neu-inset rounded-[2rem] p-8 flex items-center gap-6">
                <div className="h-24 w-24 rounded-[1.5rem] bg-background shadow-neu flex items-center justify-center text-primary font-black text-4xl shrink-0">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-foreground">{user.fullName}</h3>
                  <div className="flex items-center mt-2 px-3 py-1 bg-background shadow-neu-inset rounded-lg inline-flex">
                    <Shield size={14} className="mr-2 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{user.role}</span>
                  </div>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-background shadow-neu-inset rounded-[1.5rem] p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center">
                     <Mail size={12} className="mr-2 text-primary" /> Email Address
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {user.email}
                  </p>
                </div>
                
                {user.organizationId && (
                  <div className="bg-background shadow-neu-inset rounded-[1.5rem] p-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center">
                       <Building2 size={12} className="mr-2 text-primary" /> Organization
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {(user.organizationId as any).name}
                    </p>
                  </div>
                )}
                
                {user.officeId && (
                  <div className="bg-background shadow-neu-inset rounded-[1.5rem] p-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center">
                       <MapPin size={12} className="mr-2 text-primary" /> Office
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {(user.officeId as any).name}
                    </p>
                  </div>
                )}
                
                <div className="bg-background shadow-neu-inset rounded-[1.5rem] p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center">
                     <Shield size={12} className="mr-2 text-primary" /> Status
                  </p>
                  <p className="text-sm mt-1">
                    <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-background shadow-neu text-emerald-500">
                      {user.status}
                    </span>
                  </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
