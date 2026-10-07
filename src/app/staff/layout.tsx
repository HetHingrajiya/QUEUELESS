import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  LayoutDashboard, 
  ListTodo, 
  PlayCircle,
  History,
  UserCircle,
  Monitor,
  Bell
} from 'lucide-react';
import { ReactNode } from 'react';

const sidebarItems = [
  { name: 'Dashboard', href: '/staff/dashboard', icon: <LayoutDashboard size={20} /> },
  { name: 'Queue', href: '/staff/queue', icon: <ListTodo size={20} /> },
  { name: 'Current Token', href: '/staff/current-token', icon: <PlayCircle size={20} /> },
  { name: 'My Counter', href: '/staff/counter', icon: <Monitor size={20} /> },
  { name: 'Token History', href: '/staff/token-history', icon: <History size={20} /> },
  { name: 'Notifications', href: '/staff/notifications', icon: <Bell size={20} /> },
  { name: 'Profile', href: '/staff/profile', icon: <UserCircle size={20} /> },
];

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout sidebarItems={sidebarItems} role="STAFF">
      {children}
    </DashboardLayout>
  );
}
