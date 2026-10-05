import { getUserFromCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TokenStatus } from '@/models/Token';
import QueueTable from '../QueueTable';

export default async function CompletedQueuePage() {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'ADMIN') redirect('/login');

  return (
    <QueueTable
      orgId={user.organizationId as string}
      title="Completed Queue"
      description="Tokens that have been successfully served and completed."
      statuses={[TokenStatus.COMPLETED]}
    />
  );
}
