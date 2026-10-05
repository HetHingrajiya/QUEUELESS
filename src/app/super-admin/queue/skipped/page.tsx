import { getUserFromCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TokenStatus } from '@/models/Token';
import QueueTable from '../QueueTable';

export default async function SkippedQueuePage() {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'SUPER_ADMIN') redirect('/login');

  return (
    <QueueTable
      orgId={null}
      title="Skipped Queue"
      description="Tokens that were skipped."
      statuses={[TokenStatus.SKIPPED]}
    />
  );
}


