"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Activity, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminServicesidPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 p-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft size={16} />
        </Button>
        <h2 className="text-2xl font-bold text-slate-800">Admin - Services - [id] Details</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                  <User size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Admin - Services - [id] Item</h3>
                <p className="text-sm text-slate-500 mb-4">ID: REQ-88219</p>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                  Active
                </span>
              </div>
              <div className="mt-6 space-y-4 pt-6 border-t border-slate-100 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Created At</span>
                  <span className="font-medium text-slate-900">Oct 4, 2026</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Updated</span>
                  <span className="font-medium text-slate-900">2 hours ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Information</CardTitle>
              <CardDescription>Detailed overview of this record</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm font-medium text-slate-500 mb-1">Primary Metric</p>
                  <p className="text-lg font-bold text-slate-900">1,245</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm font-medium text-slate-500 mb-1">Secondary Metric</p>
                  <p className="text-lg font-bold text-slate-900">89.4%</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Save size={16} className="mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
