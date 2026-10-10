// Queue stats depend on live MongoDB data and must be evaluated per request.
export const dynamic = 'force-dynamic';

import { getUserFromCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TokenStatus } from '@/models/Token';
import QueueTable from '../QueueTable';

export default async function AdminLiveQueuePage() {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'SUPER_ADMIN') redirect('/login');
  
  return (
    <QueueTable
      orgId={null}
      title="Live Queue Monitor"
      description="Real-time view of active tokens across all offices."
      statuses={[TokenStatus.WAITING, TokenStatus.CALLED, TokenStatus.CHECKED_IN, TokenStatus.SERVING]}
    />
  );
}
