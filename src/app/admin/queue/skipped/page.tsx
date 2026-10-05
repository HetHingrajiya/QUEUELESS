import { getUserFromCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TokenStatus } from '@/models/Token';
import QueueTable from '../QueueTable';

export default async function SkippedQueuePage() {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'ADMIN') redirect('/login');

  return (
    <QueueTable
      orgId={user.organizationId as string}
      title="Skipped Queue"
      description="Tokens that were skipped."
      statuses={[TokenStatus.SKIPPED]}
    />
  );
}
