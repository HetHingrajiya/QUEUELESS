import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Activity, Settings, User as UserIcon, Building2, Monitor, Contact } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User, UserRole } from '@/models/User';
import { Office } from '@/models/Office';
import { Counter } from '@/models/Counter';
import { Token } from '@/models/Token';
import mongoose from 'mongoose';

export default async function AdminStaffDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getUserFromCookie();
  
  if (!currentUser || currentUser.role !== 'ADMIN') {
    redirect('/login');
  }

  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center">
        <h2 className="text-xl font-bold text-red-600">Invalid Staff ID</h2>
      </div>
    );
  }

  const staff = await User.findOne({ _id: id, role: UserRole.STAFF }).lean();

  if (!staff || staff.organizationId?.toString() !== currentUser.organizationId) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center">
        <h2 className="text-xl font-bold text-slate-800">Staff member not found or unauthorized</h2>
        <Link href="/admin/staff">
          <Button variant="outline" className="mt-4">Back to Staff</Button>
        </Link>
      </div>
    );
  }

  const office = staff.officeId ? await Office.findById(staff.officeId).lean() : null;
  const currentCounter = staff.counterId ? await Counter.findById(staff.counterId).lean() : null;
  
  // Metrics for Today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [tokensServedToday, totalTokensServed] = await Promise.all([
    Token.countDocuments({ servedBy: id, status: 'COMPLETED', updatedAt: { $gte: today } }),
    Token.countDocuments({ servedBy: id, status: 'COMPLETED' })
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/admin/staff">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <h2 className="text-2xl font-bold text-slate-800">Staff Details</h2>
        </div>
        <div className="flex space-x-2">
           <Link href={`/admin/staff/${id}/attendance`}>
             <Button variant="outline">
               <Activity size={16} className="mr-2" />
               Attendance
             </Button>
           </Link>
           <Link href={`/admin/staff/${id}/performance`}>
             <Button variant="outline">
               <Activity size={16} className="mr-2" />
               Performance
             </Button>
           </Link>
           <Link href={`/admin/staff/${id}/edit`}>
             <Button className="bg-blue-600 hover:bg-blue-700">
               <Settings size={16} className="mr-2" />
               Edit Profile
             </Button>
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-violet-100 rounded-full flex items-center justify-center text-violet-600 mb-4">
                  <UserIcon size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{staff.fullName}</h3>
                <p className="text-sm text-slate-500 mb-2">{staff.email}</p>
                {staff.employeeId && (
                  <p className="text-xs font-medium text-slate-400 mb-4">ID: {staff.employeeId}</p>
                )}
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  staff.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {staff.status}
                </span>
              </div>
              <div className="mt-6 space-y-4 pt-6 border-t border-slate-100 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Joined</span>
                  <span className="font-medium text-slate-900">
                    {new Date(staff.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Login</span>
                  <span className="font-medium text-slate-900">
                    {staff.lastLogin ? new Date(staff.lastLogin).toLocaleDateString() : 'Never'}
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
              <CardDescription>Detailed overview of this staff member</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center text-slate-500 mb-1">
                    <Building2 size={14} className="mr-1" />
                    <span className="text-sm font-medium">Assigned Office</span>
                  </div>
                  <p className="text-lg font-bold text-slate-900">{office?.name || 'Unassigned'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center text-slate-500 mb-1">
                    <Monitor size={14} className="mr-1" />
                    <span className="text-sm font-medium">Current Counter</span>
                  </div>
                  <p className="text-lg font-bold text-slate-900">{currentCounter?.name || 'Not logged in'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center text-slate-500 mb-1">
                    <Contact size={14} className="mr-1" />
                    <span className="text-sm font-medium">Contact Number</span>
                  </div>
                  <p className="text-lg font-bold text-slate-900">{staff.mobile || 'Not provided'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm font-medium text-slate-500 mb-1">Role</p>
                  <p className="text-lg font-bold text-slate-900">{staff.role}</p>
                </div>
              </div>

              <h4 className="font-medium text-slate-900 mb-4 mt-6 border-t pt-6">Performance Snapshot</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm font-medium text-slate-500 mb-1">Served Today</p>
                  <p className="text-2xl font-bold text-emerald-600">{tokensServedToday}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm font-medium text-slate-500 mb-1">All-time Served</p>
                  <p className="text-2xl font-bold text-indigo-600">{totalTokensServed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
