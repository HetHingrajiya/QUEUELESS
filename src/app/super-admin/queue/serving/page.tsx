import { getUserFromCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TokenStatus } from '@/models/Token';
import QueueTable from '../QueueTable';

export default async function ServingQueuePage() {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'SUPER_ADMIN') redirect('/login');

  return (
    <QueueTable
      orgId={null}
      title="Serving Queue"
      description="Tokens currently being served at counters."
      statuses={[TokenStatus.SERVING, TokenStatus.CALLED]}
    />
  );
}


