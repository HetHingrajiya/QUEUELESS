import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
export const dynamic = 'force-dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import dbConnect from '@/lib/db';
import { User, UserRole } from '@/models/User';
import Link from 'next/link';
import { AdminActions } from './AdminActions';

async function getAdmins() {
  await dbConnect();
  const admins = await User.find({ role: UserRole.ADMIN }).populate('organizationId').sort({ createdAt: -1 });
  return admins;
}

export default async function AdminsPage() {
  const admins = await getAdmins();

  return (
    <div className="space-y-6 p-6">
      
      <PageHeader 
        title="Administrators"
        description="Manage organization-level administrators."
        action={{ label: 'Add Admin', href: '/super-admin/admins/add', icon: <Plus size={18} /> }}
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
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin._id.toString()} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {admin.fullName}
                    </td>
                    <td className="px-6 py-4">
                      {admin.email}
                    </td>
                    <td className="px-6 py-4">
                      {admin.organizationId ? (admin.organizationId as any).name : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={admin.status || 'UNKNOWN'} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <AdminActions adminId={admin._id.toString()} />
                    </td>
                  </tr>
                ))}
                
                {admins.length === 0 && (
                  <EmptyState colSpan={5} title="No administrators found" description="Organization administrators will appear here." />
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
