import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Activity, Settings, User as UserIcon, Monitor } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Counter } from '@/models/Counter';
import { Office } from '@/models/Office';
import { User } from '@/models/User';
import { Service } from '@/models/Service';
import { Token } from '@/models/Token';
import mongoose from 'mongoose';

export default async function AdminCountersidPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUserFromCookie();
  
  if (!user || user.role !== 'ADMIN') {
    redirect('/login');
  }

  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center">
        <h2 className="text-xl font-bold text-red-600">Invalid Counter ID</h2>
      </div>
    );
  }

  const counter = await Counter.findById(id).lean();

  if (!counter) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center">
        <h2 className="text-xl font-bold text-slate-800">Counter not found</h2>
        <Link href="/admin/counters">
          <Button variant="outline" className="mt-4">Back to Counters</Button>
        </Link>
      </div>
    );
  }

  // Ensure organization isolation
  const office = await Office.findById(counter.officeId).lean();
  if (!office || office.organizationId?.toString() !== user.organizationId) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center">
        <h2 className="text-xl font-bold text-red-600">Forbidden: Counter not in your organization</h2>
      </div>
    );
  }

  const assignedStaff = counter.staffId ? await User.findById(counter.staffId).lean() : null;
  const services = counter.serviceIds && counter.serviceIds.length > 0 
    ? await Service.find({ _id: { $in: counter.serviceIds } }).lean() 
    : [];
  // Metrics
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [completedTokens, waitingTokens, currentTokenObj] = await Promise.all([
    Token.countDocuments({ counterId: id, status: 'COMPLETED', createdAt: { $gte: today } }),
    Token.countDocuments({ counterId: id, status: 'WAITING', createdAt: { $gte: today } }),
    counter.currentServiceTokenId ? Token.findById(counter.currentServiceTokenId).lean() : null,
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/admin/counters">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <h2 className="text-2xl font-bold text-slate-800">Counter Details</h2>
        </div>
        <div className="flex space-x-2">
           <Link href={`/admin/counters/${id}/edit`}>
             <Button className="bg-blue-600 hover:bg-blue-700">
               <Settings size={16} className="mr-2" />
               Edit Counter
             </Button>
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-4">
                  <Monitor size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{counter.name}</h3>
                <p className="text-sm text-slate-500 mb-4">Code: {counter.number}</p>
                
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  counter.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                  counter.status === 'PAUSED' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {counter.status}
                </span>
              </div>
              <div className="mt-6 space-y-4 pt-6 border-t border-slate-100 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Created At</span>
                  <span className="font-medium text-slate-900">
                    {new Date(counter.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Updated</span>
                  <span className="font-medium text-slate-900">
                    {new Date(counter.updatedAt).toLocaleDateString()}
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
              <CardDescription>Detailed overview of this counter</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm font-medium text-slate-500 mb-1">Office</p>
                  <p className="text-lg font-bold text-slate-900">{office.name}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm font-medium text-slate-500 mb-1">Assigned Services</p>
                  <p className="text-lg font-bold text-slate-900">{services.length > 0 ? services.map(s => s.name).join(', ') : 'All Services'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm font-medium text-slate-500 mb-1">Assigned Staff</p>
                  <p className="text-lg font-bold text-slate-900">{assignedStaff ? assignedStaff.fullName : 'None'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm font-medium text-slate-500 mb-1">Current Token</p>
                  <p className="text-lg font-bold text-slate-900">{currentTokenObj ? currentTokenObj.tokenNumber : 'None'}</p>
                </div>
              </div>

              <h4 className="font-medium text-slate-900 mb-4 mt-6 border-t pt-6">Today's Activity</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm font-medium text-slate-500 mb-1">Tokens Completed</p>
                  <p className="text-lg font-bold text-slate-900">{completedTokens}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm font-medium text-slate-500 mb-1">Tokens Waiting</p>
                  <p className="text-lg font-bold text-slate-900">{waitingTokens}</p>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
