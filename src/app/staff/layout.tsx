import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  LayoutDashboard, 
  ListTodo, 
  PlayCircle,
  History,
  UserCircle
} from 'lucide-react';
import { ReactNode } from 'react';

const sidebarItems = [
  { name: 'Dashboard', href: '/staff/dashboard', icon: <LayoutDashboard size={20} /> },
  { name: 'Queue', href: '/staff/queue', icon: <ListTodo size={20} /> },
  { name: 'Queue History', href: '/staff/queue-history', icon: <History size={20} /> },
];

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout sidebarItems={sidebarItems} role="STAFF">
      {children}
    </DashboardLayout>
  );
}
