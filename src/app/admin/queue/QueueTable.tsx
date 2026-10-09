import { PageHeader } from '@/components/common/PageHeader';
import dbConnect from '@/lib/db';
import { Token, TokenStatus } from '@/models/Token';
import { Office } from '@/models/Office';
import { QueueTableClient, SerializedTokenItem } from './QueueTableClient';

async function getTokensByStatus(orgId: string, statuses: TokenStatus[]) {
  await dbConnect();
  
  const offices = await Office.find({ organizationId: orgId }).select('_id name').lean();
  const officeIds = offices.map(o => o._id);
  const officeNames = offices.map(o => o.name).filter(Boolean);
  
  if (officeIds.length === 0) {
    return { tokens: [] as SerializedTokenItem[], offices: [] as string[] };
  }
  
  const rawTokens = await Token.find({ 
    officeId: { $in: officeIds },
    status: { $in: statuses }
  })
    .populate('officeId', 'name')
    .populate('serviceId', 'name')
    .populate('counterId', 'name counterNumber')
    .sort({ createdAt: -1 })
    .lean();

  const serialized: SerializedTokenItem[] = rawTokens.map(t => {
    let counterDisplayName = 'Waiting';
    if (t.counterId) {
      counterDisplayName = (t.counterId as any).name || `Counter ${(t.counterId as any).counterNumber}`;
    } else if (t.status === TokenStatus.COMPLETED) {
      counterDisplayName = 'Completed';
    }

    return {
      id: t._id.toString(),
      tokenNumber: t.tokenNumber,
      officeName: (t.officeId as any)?.name || '-',
      serviceName: (t.serviceId as any)?.name || '-',
      counterName: counterDisplayName,
      status: t.status,
      createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
    };
  });

  return { tokens: serialized, offices: officeNames };
}

export default async function QueueTable({ 
  orgId, 
  title, 
  description, 
  statuses 
}: { 
  orgId: string; 
  title: string; 
  description: string; 
  statuses: TokenStatus[];
}) {
  const { tokens, offices } = await getTokensByStatus(orgId, statuses);

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      <PageHeader 
        title={title}
        description={description}
      />

      <QueueTableClient 
        initialTokens={tokens}
        availableOffices={offices}
      />
    </div>
  );
}
