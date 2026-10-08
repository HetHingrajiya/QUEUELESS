import { redirect } from 'next/navigation';

export default function CitizenDashboardRedirect() {
  redirect('/citizen/home');
}
