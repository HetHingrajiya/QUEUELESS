import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Eye } from 'lucide-react';
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

  const { hasPermission } = await import('@/lib/permissions');
  const canManageServices = await hasPermission(user.userId, 'MANAGE_SERVICES');
  if (!canManageServices) redirect('/admin/unauthorized');

  const services = await getServices(user.organizationId as string);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Services"
        description="Manage services offered by your offices."
        action={{ label: 'Add Service', href: '/admin/services/add', icon: <Plus size={18} /> }}
      />

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
                        <Link href={`/admin/services/${service._id}`}>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700" title="View Dashboard">
                            <Eye size={14} />
                          </Button>
                        </Link>
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
                  <EmptyState colSpan={5} title="No services found" description="Services offered by your organization will appear here." />
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
