import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Monitor, Plus } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Office } from '@/models/Office';
import { Counter } from '@/models/Counter';
import { Service } from '@/models/Service';
import { User } from '@/models/User';
import mongoose from 'mongoose';

export default async function AdminOfficeCountersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUserFromCookie();
  
  if (!user || user.role !== 'ADMIN') {
    redirect('/login');
  }

  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return (
      <div className="p-6 text-center text-red-600">
        <h2 className="font-bold text-xl">Invalid Office ID</h2>
      </div>
    );
  }

  const office = await Office.findById(id).lean();
  if (!office || office.organizationId?.toString() !== user.organizationId) {
    return (
      <div className="p-6 text-center text-slate-800">
        <h2 className="font-bold text-xl">Office not found</h2>
        <Link href="/admin/offices">
          <Button variant="outline" className="mt-4">Back to Offices</Button>
        </Link>
      </div>
    );
  }

  const counters = await Counter.find({ officeId: id }).lean();
  
  // Populate service and staff names manually to avoid lean() projection issues
  const populatedCounters = await Promise.all(counters.map(async (c) => {
    const service = c.serviceId ? await Service.findById(c.serviceId).select('name').lean() : null;
    const staff = c.staffId ? await User.findById(c.staffId).select('fullName').lean() : null;
    return { ...c, serviceName: service?.name || '-', staffName: staff?.fullName || '-' };
  }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href={`/admin/offices/${id}`}>
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Office Counters</h2>
            <p className="text-sm text-slate-500">{office.name}</p>
          </div>
        </div>
        <Link href="/admin/counters/add">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus size={16} className="mr-2" />
            Add Counter
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Counters</CardTitle>
          <CardDescription>All counters assigned to this office</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Name/Number</th>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">Assigned Staff</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {populatedCounters.map((counter) => (
                  <tr key={counter._id.toString()} className="bg-white border-b hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div className="flex items-center">
                        <Monitor size={14} className="mr-2 text-slate-400" />
                        {counter.name} ({counter.number})
                      </div>
                    </td>
                    <td className="px-6 py-4">{counter.serviceName}</td>
                    <td className="px-6 py-4">{counter.staffName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        counter.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {counter.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/counters/${counter._id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
                
                {populatedCounters.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No counters found for this office.
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
