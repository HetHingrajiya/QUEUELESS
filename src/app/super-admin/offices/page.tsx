export const dynamic = 'force-dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import dbConnect from '@/lib/db';
import { Office } from '@/models/Office';
import Link from 'next/link';

async function getOffices() {
  await dbConnect();
  const offices = await Office.find({}).populate('organizationId').sort({ createdAt: -1 });
  return offices;
}

export default async function OfficesPage() {
  const offices = await getOffices();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Offices</h2>
          <p className="text-sm text-slate-500">Manage all registered government offices.</p>
        </div>
        <Link href="/super-admin/offices/add">
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
                  <th scope="col" className="px-6 py-4">Organization</th>
                  <th scope="col" className="px-6 py-4">City</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {offices.map((office) => (
                  <tr key={office._id.toString()} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {office.name}
                    </td>
                    <td className="px-6 py-4">
                      {office.organizationId ? (office.organizationId as any).name : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {office.city || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-100 text-emerald-700 border-emerald-200">
                        ACTIVE
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Edit">
                          <Edit size={14} className="text-slate-600" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" title="Delete">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {offices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No offices found.
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
