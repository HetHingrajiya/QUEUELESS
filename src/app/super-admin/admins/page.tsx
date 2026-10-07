import { PageHeader } from '@/components/common/PageHeader';
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
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-100 text-emerald-700 border-emerald-200">
                        ACTIVE
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <AdminActions adminId={admin._id.toString()} />
                    </td>
                  </tr>
                ))}
                
                {admins.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No administrators found.
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
