import { DashboardLayout, SidebarItem } from '@/components/layout/DashboardLayout';
import { 
  LayoutDashboard, 
  MapPin, 
  Briefcase,
  Layers,
  Users,
  ListTodo,
  Ticket,
  Calendar,
  Clock,
  BarChart3,
  Settings,
  Bell,
  FileText,
  ShieldAlert,
  UserCircle
} from 'lucide-react';
import { ReactNode } from 'react';

const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
  { name: 'Offices', href: '/admin/offices', icon: <MapPin size={20} /> },
  { name: 'Services', href: '/admin/services', icon: <Briefcase size={20} /> },
  { name: 'Counters', href: '/admin/counters', icon: <Layers size={20} /> },
  { name: 'Staff', href: '/admin/staff', icon: <Users size={20} /> },
  { 
    name: 'Queue', 
    href: '/admin/queue', 
    icon: <ListTodo size={20} />,
    subItems: [
      { name: 'Live Queue', href: '/admin/queue/live' },
      { name: 'Waiting', href: '/admin/queue/waiting' },
      { name: 'Serving', href: '/admin/queue/serving' },
      { name: 'Completed', href: '/admin/queue/completed' },
      { name: 'Skipped', href: '/admin/queue/skipped' },
      { name: 'No Show', href: '/admin/queue/no-show' }
    ]
  },
  { name: 'Tokens', href: '/admin/tokens', icon: <Ticket size={20} /> },
  { name: 'Priority Rules', href: '/admin/priority-rules', icon: <ShieldAlert size={20} /> },
  { name: 'Working Hours', href: '/admin/working-hours', icon: <Clock size={20} /> },
  { name: 'Holidays', href: '/admin/holidays', icon: <Calendar size={20} /> },
  { 
    name: 'Analytics', 
    href: '/admin/analytics', 
    icon: <BarChart3 size={20} />,
    subItems: [
      { name: 'Queue Analytics', href: '/admin/analytics/queue' },
      { name: 'Waiting Time', href: '/admin/analytics/waiting-time' },
      { name: 'Service Time', href: '/admin/analytics/service-time' },
      { name: 'Peak Hours', href: '/admin/analytics/peak-hours' },
      { name: 'No Show Rate', href: '/admin/analytics/no-show' },
      { name: 'Staff Performance', href: '/admin/analytics/staff-performance' },
      { name: 'Office Performance', href: '/admin/analytics/office-performance' }
    ]
  },
  { 
    name: 'Reports', 
    href: '/admin/reports', 
    icon: <FileText size={20} />,
    subItems: [
      { name: 'Daily Report', href: '/admin/reports/daily' },
      { name: 'Weekly Report', href: '/admin/reports/weekly' },
      { name: 'Monthly Report', href: '/admin/reports/monthly' },
      { name: 'Queue Report', href: '/admin/reports/queue' },
      { name: 'Staff Report', href: '/admin/reports/staff' },
      { name: 'Service Report', href: '/admin/reports/service' },
      { name: 'Office Report', href: '/admin/reports/office' }
    ]
  },
  { name: 'Notifications', href: '/admin/notifications', icon: <Bell size={20} /> },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: <FileText size={20} /> },
  { 
    name: 'Settings', 
    href: '/admin/settings', 
    icon: <Settings size={20} />,
    subItems: [
      { name: 'General Settings', href: '/admin/settings/general' },
      { name: 'Queue Settings', href: '/admin/settings/queue' },
      { name: 'Notifications', href: '/admin/settings/notifications' },
      { name: 'Security', href: '/admin/settings/security' }
    ]
  },
  { name: 'Profile', href: '/admin/profile', icon: <UserCircle size={20} /> }
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout sidebarItems={sidebarItems} role="ADMIN">
      {children}
    </DashboardLayout>
  );
}
