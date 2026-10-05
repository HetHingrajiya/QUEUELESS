import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import dbConnect from '@/lib/db';
import { Service } from '@/models/Service';
import { getUserFromCookie } from '@/lib/auth';
import { DeleteButton } from '@/components/DeleteButton';
import Link from 'next/link';
import { redirect } from 'next/navigation';

async function getServices(orgId: string) {
  await dbConnect();
  const services = await Service.find({ organizationId: orgId }).populate('officeId').sort({ createdAt: -1 });
  return services;
}

export default async function AdminServicesPage() {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'ADMIN') redirect('/login');
  
  const services = await getServices(user.organizationId as string);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Services</h2>
          <p className="text-sm text-slate-500">Manage services offered by your offices.</p>
        </div>
        <Link href="/admin/services/add">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus size={18} className="mr-2" />
            Add Service
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4">Service Name</th>
                  <th scope="col" className="px-6 py-4">Code</th>
                  <th scope="col" className="px-6 py-4">Avg. Time</th>
                  <th scope="col" className="px-6 py-4">Office</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service._id.toString()} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900">{service.name}</td>
                    <td className="px-6 py-4">{service.code}</td>
                    <td className="px-6 py-4">{service.averageServiceTime} mins</td>
                    <td className="px-6 py-4">{service.officeId ? (service.officeId as any).name : '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <Link href={`/admin/services/${service._id}/edit`}>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Edit">
                            <Edit size={14} className="text-slate-600" />
                          </Button>
                        </Link>
                        <DeleteButton url={`/api/services/${service._id}`} entityName="Service" />
                      </div>
                    </td>
                  </tr>
                ))}
                
                {services.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No services found in your organization.
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
