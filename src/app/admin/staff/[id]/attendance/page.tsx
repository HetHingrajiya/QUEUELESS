import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, LogIn, LogOut } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User, UserRole } from '@/models/User';
import { AuditLog } from '@/models/AuditLog';
import mongoose from 'mongoose';

export default async function AdminStaffAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getUserFromCookie();
  
  if (!currentUser || currentUser.role === 'CITIZEN' || currentUser.role === 'STAFF') {
    redirect('/login');
  }

  if (currentUser.role === 'ADMIN') {
    const { hasPermission } = await import('@/lib/permissions');
    const canManageStaff = await hasPermission(currentUser.userId, 'MANAGE_STAFF');
    if (!canManageStaff) {
      redirect('/admin/unauthorized');
    }
  }

  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return (
      <div className="p-6 text-center text-red-600">
        <h2 className="font-bold text-xl">Invalid Staff ID</h2>
      </div>
    );
  }

  const staff = await User.findOne({ _id: id, role: UserRole.STAFF }).lean();

  if (!staff || staff.organizationId?.toString() !== currentUser.organizationId) {
    return (
      <div className="p-6 text-center text-slate-800">
        <h2 className="font-bold text-xl">Staff member not found or unauthorized</h2>
        <Link href="/admin/staff">
          <Button variant="outline" className="mt-4">Back to Staff</Button>
        </Link>
      </div>
    );
  }

  // Get last 30 days attendance logs (login/logout)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const logs = await AuditLog.find({
    userId: id,
    action: { $in: ['LOGIN', 'LOGOUT'] },
    createdAt: { $gte: thirtyDaysAgo }
  }).sort({ createdAt: -1 }).lean();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href={`/admin/staff/${id}`}>
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Staff Attendance</h2>
            <p className="text-sm text-slate-500">{staff.fullName} - Last 30 Days</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>Recent login and logout activity</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id.toString()} className="bg-white border-b hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium">
                      <div className={`flex items-center ${log.action === 'LOGIN' ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {log.action === 'LOGIN' ? <LogIn size={14} className="mr-2" /> : <LogOut size={14} className="mr-2" />}
                        {log.action}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {log.ipAddress || '-'}
                    </td>
                  </tr>
                ))}
                
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      No attendance records found for the last 30 days.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
