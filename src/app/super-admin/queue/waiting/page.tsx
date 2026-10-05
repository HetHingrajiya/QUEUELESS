import { getUserFromCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TokenStatus } from '@/models/Token';
import QueueTable from '../QueueTable';

export default async function WaitingQueuePage() {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'SUPER_ADMIN') redirect('/login');

  return (
    <QueueTable
      orgId={null}
      title="Waiting Queue"
      description="Tokens waiting to be called."
      statuses={[TokenStatus.WAITING, TokenStatus.CHECKED_IN]}
    />
  );
}


