import { PageHeader } from '@/components/common/PageHeader';
export const dynamic = 'force-dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import dbConnect from '@/lib/db';
import { User, UserRole } from '@/models/User';
import Link from 'next/link';
import { StaffActions } from './StaffActions';

async function getStaff() {
  await dbConnect();
  const staff = await User.find({ role: UserRole.STAFF })
    .populate('organizationId')
    .populate('officeId')
    .sort({ createdAt: -1 });
  return staff;
}

export default async function StaffPage() {
  const staffMembers = await getStaff();

  return (
    <div className="space-y-6 p-6">
      
      <PageHeader 
        title="Staff Members"
        description="Manage office counter staff."
        action={{ label: 'Add Staff', href: '/super-admin/staff/add', icon: <Plus size={18} /> }}
      />


      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4">Name</th>
                  <th scope="col" className="px-6 py-4">Email</th>
                  <th scope="col" className="px-6 py-4">Organization</th>
                  <th scope="col" className="px-6 py-4">Office</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffMembers.map((staff) => (
                  <tr key={staff._id.toString()} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {staff.fullName}
                    </td>
                    <td className="px-6 py-4">
                      {staff.email}
                    </td>
                    <td className="px-6 py-4">
                      {staff.organizationId ? (staff.organizationId as any).name : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {staff.officeId ? (staff.officeId as any).name : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-100 text-emerald-700 border-emerald-200">
                        ACTIVE
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <StaffActions staffId={staff._id.toString()} />
                    </td>
                  </tr>
                ))}
                
                {staffMembers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No staff members found.
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
