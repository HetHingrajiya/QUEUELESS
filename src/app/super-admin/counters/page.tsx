import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
export const dynamic = 'force-dynamic';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import dbConnect from '@/lib/db';
import { Counter } from '@/models/Counter';
import { CounterActions } from './CounterActions';

async function getCounters() {
  await dbConnect();
  const counters = await Counter.find({})
    .populate('officeId')
    .populate('serviceIds')
    .sort({ createdAt: -1 });
  return counters;
}

export default async function CountersPage() {
  const counters = await getCounters();

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Counters"
        description="Manage all service counters across offices."
        action={{ label: 'Add Counter', href: '/super-admin/counters/add', icon: <Plus size={18} /> }}
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4">Counter Number</th>
                  <th scope="col" className="px-6 py-4">Name</th>
                  <th scope="col" className="px-6 py-4">Office</th>
                  <th scope="col" className="px-6 py-4">Service</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {counters.map((counter) => (
                  <tr key={counter._id.toString()} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900">{counter.number}</td>
                    <td className="px-6 py-4">{counter.name || '-'}</td>
                    <td className="px-6 py-4">{counter.officeId ? (counter.officeId as any).name : '-'}</td>
                    <td className="px-6 py-4">{counter.serviceIds && counter.serviceIds.length > 0 ? counter.serviceIds.map((s: any) => s.name).join(', ') : 'All Services'}</td>
                    <td className="px-6 py-4"><StatusBadge status={counter.status || 'OFFLINE'} /></td>
                    <td className="px-6 py-4 text-right">
                      <CounterActions counterId={counter._id.toString()} />
                    </td>
                  </tr>
                ))}
                {counters.length === 0 && (
                  <EmptyState colSpan={6} title="No counters found" description="Counters across your offices will appear here." />
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
