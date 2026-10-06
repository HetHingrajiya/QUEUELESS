import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, Building2, MapPin, Monitor, Users, Briefcase, Activity, UserSquare2 } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Office } from '@/models/Office';
import { Counter } from '@/models/Counter';
import { Service } from '@/models/Service';
import { User, UserRole } from '@/models/User';
import mongoose from 'mongoose';

export default async function AdminOfficeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getUserFromCookie();
  
  if (!currentUser || currentUser.role !== 'ADMIN') {
    redirect('/login');
  }

  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center">
        <h2 className="text-xl font-bold text-red-600">Invalid Office ID</h2>
      </div>
    );
  }

  const office = await Office.findById(id).lean();

  if (!office || office.organizationId?.toString() !== currentUser.organizationId) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center">
        <h2 className="text-xl font-bold text-slate-800">Office not found or unauthorized</h2>
        <Link href="/admin/offices">
          <Button variant="outline" className="mt-4">Back to Offices</Button>
        </Link>
      </div>
    );
  }

  const [counterCount, serviceCount, staffCount] = await Promise.all([
    Counter.countDocuments({ officeId: id }),
    Service.countDocuments({ officeId: id }),
    User.countDocuments({ officeId: id, role: UserRole.STAFF }),
  ]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/admin/offices">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <h2 className="text-2xl font-bold text-slate-800">Office Dashboard</h2>
        </div>
        <div className="flex space-x-2">
           <Link href={`/admin/offices/${id}/edit`}>
             <Button className="bg-blue-600 hover:bg-blue-700">
               <Settings size={16} className="mr-2" />
               Edit Office
             </Button>
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 mb-4">
                  <Building2 size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{office.name}</h3>
                <p className="text-sm text-slate-500 flex items-center justify-center mt-2">
                  <MapPin size={14} className="mr-1" />
                  {office.city ? `${office.city}, ${office.state}` : 'Location not specified'}
                </p>
                <span className={`mt-4 px-3 py-1 rounded-full text-xs font-medium ${
                  office.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {office.status}
                </span>
              </div>
              <div className="mt-6 space-y-4 pt-6 border-t border-slate-100 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact Email</span>
                  <span className="font-medium text-slate-900">{office.email || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact Phone</span>
                  <span className="font-medium text-slate-900">{office.phone || '-'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Link href={`/admin/offices/${id}/queue`}>
              <Card className="hover:bg-slate-50 transition-colors border-blue-200 cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <UserSquare2 size={32} className="text-blue-600 mb-3" />
                  <h3 className="font-bold text-slate-800">Live Queue</h3>
                  <p className="text-sm text-slate-500 mt-1">Monitor currently waiting and serving tokens</p>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/admin/offices/${id}/analytics`}>
              <Card className="hover:bg-slate-50 transition-colors border-indigo-200 cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Activity size={32} className="text-indigo-600 mb-3" />
                  <h3 className="font-bold text-slate-800">Analytics</h3>
                  <p className="text-sm text-slate-500 mt-1">View performance and queue metrics</p>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/admin/offices/${id}/counters`}>
              <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Monitor size={32} className="text-slate-400 mb-3" />
                  <h3 className="font-bold text-slate-800">Counters ({counterCount})</h3>
                  <p className="text-sm text-slate-500 mt-1">Manage office counters</p>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/admin/offices/${id}/services`}>
              <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Briefcase size={32} className="text-slate-400 mb-3" />
                  <h3 className="font-bold text-slate-800">Services ({serviceCount})</h3>
                  <p className="text-sm text-slate-500 mt-1">Manage provided services</p>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/admin/offices/${id}/staff`}>
              <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full md:col-span-2">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Users size={32} className="text-slate-400 mb-3" />
                  <h3 className="font-bold text-slate-800">Staff Members ({staffCount})</h3>
                  <p className="text-sm text-slate-500 mt-1">Manage employees assigned to this office</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
