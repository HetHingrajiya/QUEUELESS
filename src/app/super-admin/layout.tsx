import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  MapPin, 
  Briefcase, 
  Settings,
  Shield,
  Bell,
  BarChart3,
  FileText,
  ServerCog,
  Ticket,
  User,
  Star
} from 'lucide-react';
import { ReactNode } from 'react';

const sidebarItems = [
  { name: 'Dashboard', href: '/super-admin/dashboard', icon: <LayoutDashboard size={20} /> },
  { 
    name: 'Organizations', 
    href: '/super-admin/organizations', 
    icon: <Building2 size={20} />,
    subItems: [
      { name: 'All Organizations', href: '/super-admin/organizations' },
      { name: 'Organization Types', href: '/super-admin/organization-types' },
    ]
  },
  { name: 'Admins', href: '/super-admin/admins', icon: <Users size={20} /> },
  { name: 'Offices', href: '/super-admin/offices', icon: <MapPin size={20} /> },
  { name: 'Services', href: '/super-admin/services', icon: <Briefcase size={20} /> },
  { name: 'Counters', href: '/super-admin/counters', icon: <ServerCog size={20} /> },
  { name: 'Staff', href: '/super-admin/staff', icon: <Users size={20} /> },
  { 
    name: 'Queue Management', 
    href: '/super-admin/queue', 
    icon: <Ticket size={20} />,
    subItems: [
      { name: 'Live Queue', href: '/super-admin/queue/live' },
      { name: 'Waiting', href: '/super-admin/queue/waiting' },
      { name: 'Serving', href: '/super-admin/queue/serving' },
      { name: 'Completed', href: '/super-admin/queue/completed' },
      { name: 'Skipped', href: '/super-admin/queue/skipped' },
      { name: 'No-Show', href: '/super-admin/queue/no-show' },
      { name: 'Queue Settings', href: '/super-admin/queue-settings' }
    ]
  },
  { name: 'Priority Rules', href: '/super-admin/priority-rules', icon: <Star size={20} /> },
  { 
    name: 'Roles & Permissions', 
    href: '/super-admin/roles', 
    icon: <Shield size={20} />,
    subItems: [
      { name: 'Roles', href: '/super-admin/roles' },
      { name: 'Permissions', href: '/super-admin/permissions' },
    ]
  },
  { name: 'Analytics', href: '/super-admin/analytics', icon: <BarChart3 size={20} /> },
  { name: 'Reports', href: '/super-admin/reports', icon: <FileText size={20} /> },
  { name: 'Notifications', href: '/super-admin/notifications', icon: <Bell size={20} /> },
  { name: 'Audit Logs', href: '/super-admin/audit-logs', icon: <FileText size={20} /> },
  { name: 'System Settings', href: '/super-admin/system-settings', icon: <Settings size={20} /> },
  { name: 'Profile', href: '/super-admin/profile', icon: <User size={20} /> },
];

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout sidebarItems={sidebarItems} role="SUPER ADMIN">
      {children}
    </DashboardLayout>
  );
}
