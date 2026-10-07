export const dynamic = 'force-dynamic';
import { Eye, Edit, Plus } from 'lucide-react';
import dbConnect from '@/lib/db';
import { Counter } from '@/models/Counter';
import { Office } from '@/models/Office';
import { Service } from '@/models/Service';
import { User } from '@/models/User';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DeleteButton } from '@/components/DeleteButton';
import { redirect } from 'next/navigation';
import { getUserFromCookie } from '@/lib/auth';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';

async function getCounters() {
  await dbConnect();
  const user = await getUserFromCookie();
  if (!user || user.role !== 'ADMIN') redirect('/login');
  
  const offices = await Office.find({ organizationId: user.organizationId }).select('_id');
  const counters = await Counter.find({ officeId: { $in: offices } })
    .populate('officeId')
    .populate('serviceIds')
    .populate('staffId')
    .sort({ number: 1 });
  return counters;
}

export default async function AdminCounters() {
  const counters = await getCounters();

  const columns: Column<any>[] = [
    {
      header: 'Counter Number',
      render: (counter) => <span className="font-bold text-slate-900">C-{counter.number}</span>
    },
    { header: 'Name', accessor: 'name', className: 'font-medium' },
    {
      header: 'Office',
      render: (counter) => counter.officeId ? counter.officeId.name : <span className="text-slate-400 italic">Unassigned</span>
    },
    {
      header: 'Assigned Service',
      render: (counter) => counter.serviceIds && counter.serviceIds.length > 0 ? counter.serviceIds.map((s: any) => s.name).join(', ') : <span className="text-slate-400 italic">Unassigned</span>
    },
    {
      header: 'Assigned Staff',
      render: (counter) => counter.staffId ? counter.staffId.fullName : <span className="text-slate-400 italic">Unassigned</span>
    },
    {
      header: 'Status',
      render: (counter) => <StatusBadge status={counter.status} />
    },
    {
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (counter) => (
        <div className="flex justify-end space-x-2">
          <Link href={`/admin/counters/${counter._id}`}>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700" title="View Dashboard">
              <Eye size={14} />
            </Button>
          </Link>
          <Link href={`/admin/counters/${counter._id}/edit`}>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Edit">
              <Edit size={14} className="text-slate-600" />
            </Button>
          </Link>
          <DeleteButton url={`/api/counters/${counter._id}`} entityName="Counter" />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <PageHeader 
        title="Counter Management" 
        action={{
          label: 'Add New Counter',
          href: '/admin/counters/add',
          icon: <Plus size={18} />
        }}
      />
      
      <DataTable 
        data={counters} 
        columns={columns} 
        keyExtractor={(c) => c._id.toString()}
        emptyMessage="No counters found. Create your first counter to get started."
      />
    </div>
  );
}
