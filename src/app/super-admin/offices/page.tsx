import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
export const dynamic = 'force-dynamic';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import dbConnect from '@/lib/db';
import { Office } from '@/models/Office';
import { OfficeActions } from './OfficeActions';

async function getOffices() {
  await dbConnect();
  const offices = await Office.find({}).populate('organizationId').sort({ createdAt: -1 });
  return offices;
}

export default async function OfficesPage() {
  const offices = await getOffices();

  return (
    <div className="space-y-6 p-6">
      
      <PageHeader 
        title="Offices"
        description="Manage all registered government offices."
        action={{ label: 'Add Office', href: '/super-admin/offices/add', icon: <Plus size={18} /> }}
      />


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
                      <StatusBadge status="ACTIVE" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <OfficeActions officeId={office._id.toString()} />
                    </td>
                  </tr>
                ))}
                
                {offices.length === 0 && (
                  <EmptyState colSpan={5} title="No offices found" description="Registered government offices will appear here." />
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
