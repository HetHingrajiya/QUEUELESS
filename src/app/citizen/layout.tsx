import React from 'react';
import { DashboardLayout, SidebarItem } from '@/components/layout/DashboardLayout';
import { Home, Compass, Layers, Clock, User, Bell, Star, HelpCircle, Settings } from 'lucide-react';

const citizenSidebarItems: SidebarItem[] = [
  { name: 'Home', href: '/citizen/home', icon: <Home size={20} /> },
  { name: 'Explore Offices', href: '/citizen/offices', icon: <Compass size={20} /> },
  { name: 'My Queue', href: '/citizen/queue/my', icon: <Layers size={20} /> },
  { name: 'Token History', href: '/citizen/token-history', icon: <Clock size={20} /> },
  { name: 'Notifications', href: '/citizen/notifications', icon: <Bell size={20} /> },
  { name: 'Favorites', href: '/citizen/favorites', icon: <Star size={20} /> },
  {
    name: 'Account',
    href: '/citizen/profile',
    icon: <User size={20} />,
    subItems: [
      { name: 'Profile', href: '/citizen/profile' },
      { name: 'Settings', href: '/citizen/settings' },
      { name: 'Help & Support', href: '/citizen/help' }
    ]
  }
];

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout sidebarItems={citizenSidebarItems} role="Citizen">
      {children}
    </DashboardLayout>
  );
}
