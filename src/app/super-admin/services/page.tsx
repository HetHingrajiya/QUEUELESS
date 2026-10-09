import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
export const dynamic = 'force-dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import dbConnect from '@/lib/db';
import { Service } from '@/models/Service';
import Link from 'next/link';
import { ServiceActions } from './ServiceActions';

async function getServices() {
  await dbConnect();
  const services = await Service.find({}).populate('organizationId').populate('officeId').sort({ createdAt: -1 });
  return services;
}

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <div className="space-y-6 p-6">
      
      <PageHeader 
        title="Services"
        description="Manage all government services."
        action={{ label: 'Add Service', href: '/super-admin/services/add', icon: <Plus size={18} /> }}
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
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service._id.toString()} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {service.name}
                    </td>
                    <td className="px-6 py-4">
                      {service.code}
                    </td>
                    <td className="px-6 py-4">
                      {service.averageServiceTime} mins
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={service.status || 'UNKNOWN'} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ServiceActions serviceId={service._id.toString()} />
                    </td>
                  </tr>
                ))}
                
                {services.length === 0 && (
                  <EmptyState colSpan={5} title="No services found" description="Government services will appear here once added." />
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
