import { getUserFromCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TokenStatus } from '@/models/Token';
import QueueTable from '../QueueTable';

export default async function ServingQueuePage() {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'ADMIN') redirect('/login');

  return (
    <QueueTable
      orgId={user.organizationId as string}
      title="Serving Queue"
      description="Tokens currently being served at counters."
      statuses={[TokenStatus.SERVING, TokenStatus.CALLED]}
    />
  );
}
