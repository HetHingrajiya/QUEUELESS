import { redirect } from 'next/navigation';

export default function AdminQueueRedirect() {
  redirect('/admin/queue/live');
}


