"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut, ChevronDown } from 'lucide-react';

export interface SidebarSubItem {
  name: string;
  href: string;
}

export interface SidebarItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  subItems?: SidebarSubItem[];
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebarItems: SidebarItem[];
  role: string;
}

export function DashboardLayout({ children, sidebarItems, role }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const toggleSubmenu = (name: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/80 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 h-screen max-h-screen ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col shrink-0`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 shrink-0">
          <span className="text-xl font-bold text-blue-600">QueueLess</span>
          <button 
            className="lg:hidden text-slate-500 hover:text-slate-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="px-5 py-2 mt-3 text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">
          {role} PORTAL
        </div>

        <nav className="flex-1 min-h-0 px-3.5 mt-1 space-y-1 overflow-y-auto custom-scrollbar">
          {sidebarItems.map((item) => {
            // Check if active (including subpaths)
            const isActive = pathname === item.href || (pathname?.startsWith(`${item.href}/`) ?? false);
            // Check if any subitem is active
            const hasActiveSub = item.subItems?.some(sub => pathname === sub.href) || false;
            
            // Auto expand if active
            const isExpanded = expandedMenus[item.name] !== undefined 
              ? expandedMenus[item.name] 
              : (isActive || hasActiveSub);

            return (
              <div key={item.name} className="flex flex-col">
                {item.subItems && item.subItems.length > 0 ? (
                  <button
                    onClick={() => toggleSubmenu(item.name)}
                    className={`flex items-center justify-between px-3.5 py-2.5 text-sm rounded-xl transition-colors ${
                      (isActive || hasActiveSub)
                        ? 'bg-blue-50 text-blue-700 font-semibold' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0">{item.icon}</span>
                      <span className="whitespace-nowrap font-medium">{item.name}</span>
                    </div>
                    <ChevronDown size={16} className={`shrink-0 ml-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-xl transition-colors ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700 font-semibold' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="whitespace-nowrap font-medium">{item.name}</span>
                  </Link>
                )}

                {/* Submenus */}
                {item.subItems && isExpanded && (
                  <div className="mt-1 ml-4 space-y-0.5 pl-3 border-l-2 border-slate-100">
                    {item.subItems.map(sub => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          className={`block px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                            isSubActive
                              ? 'text-blue-700 font-semibold bg-blue-50'
                              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          {sub.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200 shrink-0 bg-white sticky bottom-0 z-10">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3.5 py-2.5 text-sm text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} className="mr-3 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 sm:px-6 lg:px-8 justify-between shrink-0">
          <div className="flex items-center">
            <button
              className="lg:hidden text-slate-500 hover:text-slate-700 mr-4"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-slate-800">
              {sidebarItems.find(i => pathname === i.href || (pathname?.startsWith(`${i.href}/`) ?? false))?.name || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              {role.charAt(0)}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
