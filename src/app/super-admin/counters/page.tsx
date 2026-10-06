export const dynamic = 'force-dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import dbConnect from '@/lib/db';
import { Counter } from '@/models/Counter';
import Link from 'next/link';
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Counters</h2>
          <p className="text-sm text-slate-500">Manage all service counters across offices.</p>
        </div>
        <Link href="/super-admin/counters/add">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus size={18} className="mr-2" />
            Add Counter
          </Button>
        </Link>
      </div>

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
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {counter.number}
                    </td>
                    <td className="px-6 py-4">
                      {counter.name || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {counter.officeId ? (counter.officeId as any).name : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {counter.serviceIds && counter.serviceIds.length > 0 ? counter.serviceIds.map((s: any) => s.name).join(', ') : 'All Services'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${counter.status === 'ACTIVE' || counter.status === 'SERVING' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                        {counter.status || 'OFFLINE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <CounterActions counterId={counter._id.toString()} />
                    </td>
                  </tr>
                ))}
                
                {counters.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No counters found.
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
