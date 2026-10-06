import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, LogIn, LogOut, Search } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User, UserRole } from '@/models/User';
import { AuditLog } from '@/models/AuditLog';
import { Office } from '@/models/Office';
import mongoose from 'mongoose';

export default async function AdminGlobalStaffAttendancePage() {
  const currentUser = await getUserFromCookie();
  
  if (!currentUser || currentUser.role !== 'ADMIN') {
    redirect('/login');
  }

  await dbConnect();

  // Get all staff for this organization
  const staffMembers = await User.find({ 
    role: UserRole.STAFF, 
    organizationId: currentUser.organizationId 
  }).populate('officeId').lean();

  // For the global page, let's just get today's login events for simplicity, 
  // or the last 7 days of attendance
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // Get today's logs for all these staff members
  const staffIds = staffMembers.map(s => s._id);
  const todayLogs = await AuditLog.find({
    userId: { $in: staffIds },
    action: { $in: ['LOGIN', 'LOGOUT'] },
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  }).sort({ createdAt: 1 }).lean();

  // Process logs per staff
  const staffAttendance = staffMembers.map(staff => {
    const logs = todayLogs.filter(log => log.userId?.toString() === staff._id.toString());
    const firstLogin = logs.find(log => log.action === 'LOGIN');
    const lastLogout = [...logs].reverse().find(log => log.action === 'LOGOUT');
    
    // Status Logic
    let status = 'ABSENT';
    if (firstLogin && !lastLogout) status = 'PRESENT';
    if (firstLogin && lastLogout) status = 'COMPLETED';

    return {
      ...staff,
      office: staff.officeId ? (staff.officeId as any).name : 'Unassigned',
      firstLogin: firstLogin ? new Date(firstLogin.createdAt).toLocaleTimeString() : '-',
      lastLogout: lastLogout ? new Date(lastLogout.createdAt).toLocaleTimeString() : '-',
      status
    };
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Global Staff Attendance</h2>
          <p className="text-sm text-slate-500">Today's attendance for all staff members.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Today's Attendance Overview</CardTitle>
            <div className="flex space-x-2">
               <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">Date: {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Staff Name</th>
                  <th className="px-6 py-4">Office</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">First Login</th>
                  <th className="px-6 py-4">Last Logout</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffAttendance.map((staff) => (
                  <tr key={staff._id.toString()} className="bg-white hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {staff.fullName}
                    </td>
                    <td className="px-6 py-4">
                      {staff.office}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        staff.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' :
                        staff.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {staff.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {staff.firstLogin}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {staff.lastLogout}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/staff/${staff._id}/attendance`}>
                        <Button variant="outline" size="sm" className="h-8 text-xs text-blue-600 border-blue-200">
                          View Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
                
                {staffAttendance.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No staff members found in your organization.
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
