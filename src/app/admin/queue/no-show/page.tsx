import { getUserFromCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TokenStatus } from '@/models/Token';
import QueueTable from '../QueueTable';

export default async function NoShowQueuePage() {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'ADMIN') redirect('/login');

  return (
    <QueueTable
      orgId={user.organizationId as string}
      title="No Show Queue"
      description="Tokens that were marked as No Show."
      statuses={[TokenStatus.NO_SHOW]}
    />
  );
}
