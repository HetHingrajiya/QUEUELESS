export const dynamic = 'force-dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Settings, PlayCircle, PauseCircle, PowerOff, Edit } from 'lucide-react';
import dbConnect from '@/lib/db';
import { Counter, CounterStatus } from '@/models/Counter';
import { Service } from '@/models/Service';
import { User } from '@/models/User';
import Link from 'next/link';

async function getCounters() {
  await dbConnect();
  const counters = await Counter.find({}).populate('serviceId').populate('staffId').sort({ number: 1 });
  return counters;
}

export default async function AdminCounters() {
  const counters = await getCounters();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'PAUSED': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'OFFLINE': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'MAINTENANCE': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Counter Management</h2>
        <Link href="/admin/counters/add">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus size={18} className="mr-2" />
            Add New Counter
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
                  <th scope="col" className="px-6 py-4">Assigned Service</th>
                  <th scope="col" className="px-6 py-4">Assigned Staff</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {counters.map((counter) => (
                  <tr key={counter._id.toString()} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      C-{counter.number}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {counter.name}
                    </td>
                    <td className="px-6 py-4">
                      {counter.serviceId ? (counter.serviceId as any).name : <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4">
                      {counter.staffId ? (counter.staffId as any).fullName : <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(counter.status)}`}>
                        {counter.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <Link href={`/admin/counters/${counter._id}/edit`}>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Edit">
                            <Edit size={14} className="text-slate-600" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Settings">
                          <Settings size={14} className="text-slate-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {counters.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No counters found. Create your first counter to get started.
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
