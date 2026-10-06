import Link from 'next/link';
import { Settings2, Bell, Shield, Building2, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const settingsLinks = [
  {
    href: '/admin/settings/general',
    icon: <Building2 className="text-blue-600" size={22} />,
    title: 'General Settings',
    description: 'Organization name, contact info, and address.',
  },
  {
    href: '/admin/settings/queue',
    icon: <Settings2 className="text-emerald-600" size={22} />,
    title: 'Queue Settings',
    description: 'Queue capacity, no-show timeout, and check-in buffer.',
  },
  {
    href: '/admin/settings/notifications',
    icon: <Bell className="text-amber-500" size={22} />,
    title: 'Notification Settings',
    description: 'Configure notification channels and preferences.',
  },
  {
    href: '/admin/settings/security',
    icon: <Shield className="text-purple-600" size={22} />,
    title: 'Security Settings',
    description: 'Session timeout and login security policies.',
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
        <p className="text-sm text-slate-500 mt-1">Manage your organization's configuration and security preferences.</p>
      </div>

      <div className="space-y-3">
        {settingsLinks.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer border border-slate-200 hover:border-blue-200">
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.description}</p>
                  </div>
                </div>
                <ChevronRight className="text-slate-400" size={18} />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
