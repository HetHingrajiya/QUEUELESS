import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import dbConnect from '@/lib/db';
import { Office } from '@/models/Office';
import { getUserFromCookie } from '@/lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

async function getOffices(orgId: string) {
  await dbConnect();
  const offices = await Office.find({ organizationId: orgId }).sort({ createdAt: -1 });
  return offices;
}

export default async function AdminOfficesPage() {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'ADMIN') redirect('/login');
  
  const offices = await getOffices(user.organizationId as string);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Offices</h2>
          <p className="text-sm text-slate-500">Manage branches under your organization.</p>
        </div>
        <Link href="/admin/offices/add">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus size={18} className="mr-2" />
            Add Office
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4">Office Name</th>
                  <th scope="col" className="px-6 py-4">City</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {offices.map((office) => (
                  <tr key={office._id.toString()} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900">{office.name}</td>
                    <td className="px-6 py-4">{office.city || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-100 text-emerald-700 border-emerald-200">
                        ACTIVE
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <Link href={`/admin/offices/${office._id}/edit`}>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Edit">
                            <Edit size={14} className="text-slate-600" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {offices.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      No offices found in your organization.
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
