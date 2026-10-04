export const dynamic = 'force-dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import dbConnect from '@/lib/db';
import { Organization } from '@/models/Organization';
import Link from 'next/link';

async function getOrganizations() {
  await dbConnect();
  const orgs = await Organization.find({}).sort({ createdAt: -1 });
  return orgs;
}

export default async function OrganizationsPage() {
  const organizations = await getOrganizations();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Organizations</h2>
          <p className="text-sm text-slate-500">Manage all registered government entities.</p>
        </div>
        <Link href="/super-admin/organizations/add">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus size={18} className="mr-2" />
            Add Organization
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4">Organization Name</th>
                  <th scope="col" className="px-6 py-4">Type</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4">Joined Date</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <tr key={org._id.toString()} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {org.name}
                    </td>
                    <td className="px-6 py-4">
                      {org.type || 'Government'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-100 text-emerald-700 border-emerald-200">
                        ACTIVE
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <Link href={`/super-admin/organizations/${org._id.toString()}/edit`}>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Edit">
                            <Edit size={14} className="text-slate-600" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {organizations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No organizations found.
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
