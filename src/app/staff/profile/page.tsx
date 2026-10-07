"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, User, Building, Monitor, Shield, Mail, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function StaffProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
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

        if (authJson.success) setProfile(authJson.data);
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
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Profile Not Found</h2>
        <p className="text-slate-500">Failed to load your profile information.</p>
      </div>
    );
  }

  const { counter, office } = dashboard || {};

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">My Profile</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card className="overflow-hidden border-0 shadow-md">
            <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            <CardContent className="p-6 relative pt-12 text-center">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-white rounded-full p-1 shadow-md">
                <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-slate-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900">{profile.name}</h3>
              <p className="text-sm text-slate-500 mb-4">{profile.email}</p>
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">{profile.role}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm text-slate-500 uppercase tracking-wider">Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <button className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                <div className="flex items-center text-sm font-medium text-slate-700">
                  <Shield className="w-4 h-4 mr-3 text-slate-400" />
                  Change Password
                </div>
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                <div className="flex items-center text-sm font-medium text-slate-700">
                  <Mail className="w-4 h-4 mr-3 text-slate-400" />
                  Update Email
                </div>
              </button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>Your assigned office and counter information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div>
                  <div className="flex items-center text-lg font-medium text-slate-800 mb-4">
                    <Building className="w-5 h-5 mr-2 text-blue-600" />
                    Office Information
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 text-sm bg-slate-50 p-4 rounded-lg">
                    <div>
                      <dt className="text-slate-500 font-medium">Office Name</dt>
                      <dd className="mt-1 font-semibold text-slate-900">{office?.name || 'Not Assigned'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 font-medium">Organization</dt>
                      <dd className="mt-1 font-semibold text-slate-900">{office?.organizationId?.name || 'Not Assigned'}</dd>
                    </div>
                  </dl>
                </div>

                <hr className="border-slate-100" />

                <div>
                  <div className="flex items-center text-lg font-medium text-slate-800 mb-4">
                    <Monitor className="w-5 h-5 mr-2 text-indigo-600" />
                    Counter Assignment
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 text-sm bg-slate-50 p-4 rounded-lg">
                    {counter ? (
                      <>
                        <div>
                          <dt className="text-slate-500 font-medium">Counter Name</dt>
                          <dd className="mt-1 font-semibold text-slate-900">{counter.name}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-500 font-medium">Counter Number</dt>
                          <dd className="mt-1 font-semibold text-slate-900">{counter.number}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-slate-500 font-medium">Handled Services</dt>
                          <dd className="mt-1 font-semibold text-slate-900 leading-relaxed">{counter.serviceNames}</dd>
                        </div>
                      </>
                    ) : (
                      <div className="sm:col-span-2 text-amber-600 font-medium">
                        You are not currently assigned to any counter.
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
