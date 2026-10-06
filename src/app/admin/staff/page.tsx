import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import dbConnect from '@/lib/db';
import { User, UserRole } from '@/models/User';
import { getUserFromCookie } from '@/lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DeleteButton } from '@/components/DeleteButton';

async function getStaff(orgId: string) {
  await dbConnect();
  const staff = await User.find({ role: UserRole.STAFF, organizationId: orgId })
    .populate('officeId')
    .sort({ createdAt: -1 });
  return staff;
}

export default async function AdminStaffPage() {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'ADMIN') redirect('/login');

  
  const staffMembers = await getStaff(user.organizationId as string);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Staff</h2>
          <p className="text-sm text-slate-500">Manage counter staff in your offices.</p>
        </div>
        
        <Link href="/admin/staff/add">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus size={18} className="mr-2" />
            Add Staff
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4">Name</th>
                  <th scope="col" className="px-6 py-4">Email</th>
                  <th scope="col" className="px-6 py-4">Office</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffMembers.map((staff) => (
                  <tr key={staff._id.toString()} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900">{staff.fullName}</td>
                    <td className="px-6 py-4">{staff.email}</td>
                    <td className="px-6 py-4">{staff.officeId ? (staff.officeId as any).name : '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <Link href={`/admin/staff/${staff._id}`}>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700" title="View Dashboard">
                            <Eye size={14} />
                          </Button>
                        </Link>
                        <Link href={`/admin/staff/${staff._id}/edit`}>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Edit">
                            <Edit size={14} className="text-slate-600" />
                          </Button>
                        </Link>
                        <DeleteButton url={`/api/staff/${staff._id}`} entityName="Staff" />
                      </div>
                    </td>
                  </tr>
                ))}
                
                {staffMembers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
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
