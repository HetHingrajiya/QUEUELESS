import { getUserFromCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TokenStatus } from '@/models/Token';
import QueueTable from '../QueueTable';

export default async function CompletedQueuePage() {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'SUPER_ADMIN') redirect('/login');

  return (
    <QueueTable
      orgId={null}
      title="Completed Queue"
      description="Tokens that have been successfully served and completed."
      statuses={[TokenStatus.COMPLETED]}
    />
  );
}


