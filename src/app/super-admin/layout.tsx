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
  ServerCog
} from 'lucide-react';
import { ReactNode } from 'react';

const sidebarItems = [
  { name: 'Dashboard', href: '/super-admin/dashboard', icon: <LayoutDashboard size={20} /> },
  { name: 'Organizations', href: '/super-admin/organizations', icon: <Building2 size={20} /> },
  { name: 'Org Types', href: '/super-admin/organization-types', icon: <ServerCog size={20} /> },
  { name: 'Admins', href: '/super-admin/admins', icon: <Users size={20} /> },
  { name: 'Offices', href: '/super-admin/offices', icon: <MapPin size={20} /> },
  { name: 'Services', href: '/super-admin/services', icon: <Briefcase size={20} /> },
  { name: 'Roles & Permissions', href: '/super-admin/roles', icon: <Shield size={20} /> },
  { name: 'Notifications', href: '/super-admin/notifications', icon: <Bell size={20} /> },
  { name: 'Analytics', href: '/super-admin/analytics', icon: <BarChart3 size={20} /> },
  { name: 'Audit Logs', href: '/super-admin/audit-logs', icon: <FileText size={20} /> },
  { name: 'System Settings', href: '/super-admin/system-settings', icon: <Settings size={20} /> },
];

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout sidebarItems={sidebarItems} role="SUPER ADMIN">
      {children}
    </DashboardLayout>
  );
}
