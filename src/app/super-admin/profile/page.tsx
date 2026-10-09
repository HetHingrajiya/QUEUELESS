// This profile queries the authenticated user and live MongoDB data per request.
export const dynamic = 'force-dynamic';

import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Mail, Shield, Building, Building2, MapPin } from 'lucide-react';
import dbConnect from '@/lib/db';
import { User as UserModel } from '@/models/User';
import { getUserFromCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  await dbConnect();
  
  const authUser = await getUserFromCookie();
  if (!authUser) {
    redirect('/auth/login');
  }

  const user = await UserModel.findById(authUser.userId)
    .populate('organizationId')
    .populate('officeId')
    .lean();

  if (!user) {
    return <div className="p-6">User not found</div>;
  }

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      
      <PageHeader 
        title="My Profile"
        description="Manage your account information and preferences."
      />


      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Your personal details and contact info.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">{user.fullName}</h3>
              <p className="text-sm text-slate-500 flex items-center mt-1">
                <Shield size={14} className="mr-1 text-slate-400" />
                {user.role}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Email Address</p>
              <p className="text-sm text-slate-900 font-medium flex items-center">
                <Mail size={16} className="mr-2 text-slate-400" />
                {user.email}
              </p>
            </div>
            
            {user.organizationId && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Organization</p>
                <p className="text-sm text-slate-900 font-medium flex items-center">
                  <Building2 size={16} className="mr-2 text-slate-400" />
                  {(user.organizationId as any).name}
                </p>
              </div>
            )}
            
            {user.officeId && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Office</p>
                <p className="text-sm text-slate-900 font-medium flex items-center">
                  <MapPin size={16} className="mr-2 text-slate-400" />
                  {(user.officeId as any).name}
                </p>
              </div>
            )}
            
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Status</p>
              <p className="text-sm mt-1">
                <span className="px-2 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {user.status}
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
