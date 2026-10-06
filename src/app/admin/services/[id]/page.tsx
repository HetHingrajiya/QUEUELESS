import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Activity, Settings, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Service } from '@/models/Service';
import { Office } from '@/models/Office';
import { Organization } from '@/models/Organization';
import { Token } from '@/models/Token';
import mongoose from 'mongoose';

export default async function AdminServiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUserFromCookie();
  
  if (!user || user.role !== 'ADMIN') {
    redirect('/login');
  }

  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center">
        <h2 className="text-xl font-bold text-red-600">Invalid Service ID</h2>
      </div>
    );
  }

  const service = await Service.findById(id).lean();

  if (!service || service.organizationId?.toString() !== user.organizationId) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center">
        <h2 className="text-xl font-bold text-slate-800">Service not found or unauthorized</h2>
        <Link href="/admin/services">
          <Button variant="outline" className="mt-4">Back to Services</Button>
        </Link>
      </div>
    );
  }

  const office = await Office.findById(service.officeId).lean();
  
  // Metrics for Today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalTokens, completedTokens, waitingTokens] = await Promise.all([
    Token.countDocuments({ serviceId: id, createdAt: { $gte: today } }),
    Token.countDocuments({ serviceId: id, status: 'COMPLETED', createdAt: { $gte: today } }),
    Token.countDocuments({ serviceId: id, status: 'WAITING', createdAt: { $gte: today } })
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/admin/services">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <h2 className="text-2xl font-bold text-slate-800">Service Details</h2>
        </div>
        <div className="flex space-x-2">
          <Link href={`/admin/services/${id}/analytics`}>
             <Button variant="outline">
               <Activity size={16} className="mr-2" />
               Analytics
             </Button>
           </Link>
           <Link href={`/admin/services/${id}/edit`}>
             <Button className="bg-blue-600 hover:bg-blue-700">
               <Settings size={16} className="mr-2" />
               Edit Service
             </Button>
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                  <LayoutGrid size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{service.name}</h3>
                <p className="text-sm text-slate-500 mb-4">Code: {service.code}</p>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  service.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {service.status}
                </span>
              </div>
              <div className="mt-6 space-y-4 pt-6 border-t border-slate-100 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Created At</span>
                  <span className="font-medium text-slate-900">
                    {new Date(service.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Updated</span>
                  <span className="font-medium text-slate-900">
                    {new Date(service.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Information</CardTitle>
              <CardDescription>Detailed overview of this service</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm font-medium text-slate-500 mb-1">Office</p>
                  <p className="text-lg font-bold text-slate-900">{office?.name || 'Unknown'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm font-medium text-slate-500 mb-1">Average Time</p>
                  <p className="text-lg font-bold text-slate-900">{service.averageServiceTime} mins</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm font-medium text-slate-500 mb-1">Priority Enabled</p>
                  <p className="text-lg font-bold text-slate-900">{service.priorityEnabled ? 'Yes' : 'No'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm font-medium text-slate-500 mb-1">Daily Limit</p>
                  <p className="text-lg font-bold text-slate-900">{service.dailyTokenLimit || 'Unlimited'}</p>
                </div>
              </div>

              {service.description && (
                <div className="mb-6">
                  <h4 className="font-medium text-slate-900 mb-2 border-t pt-6">Description</h4>
                  <p className="text-slate-600 text-sm">{service.description}</p>
                </div>
              )}

              <h4 className="font-medium text-slate-900 mb-4 mt-6 border-t pt-6">Today's Activity</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm font-medium text-slate-500 mb-1">Total Tokens</p>
                  <p className="text-lg font-bold text-slate-900">{totalTokens}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm font-medium text-slate-500 mb-1">Completed</p>
                  <p className="text-lg font-bold text-emerald-600">{completedTokens}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm font-medium text-slate-500 mb-1">Waiting</p>
                  <p className="text-lg font-bold text-amber-600">{waitingTokens}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
