"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut, ChevronDown, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

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
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className="min-h-screen bg-background flex text-foreground">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/80 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-background transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 h-screen max-h-screen ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col shrink-0 shadow-neu`}
      >
        <div className="flex items-center justify-between h-16 px-6 shrink-0">
          <div className="flex items-center gap-2 cursor-pointer transition-transform duration-300 hover:scale-105">
            <Image src="/assets/logo.png" alt="SamaySetu Logo" width={32} height={32} className="object-contain drop-shadow-md" />
            <span className="text-xl font-extrabold text-primary tracking-tight">SamaySetu</span>
          </div>
          <button 
            className="lg:hidden text-muted-foreground hover:text-foreground transition-transform duration-300 hover:scale-110 active:scale-95"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="px-4 py-2 mt-4 text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">
          {role} PORTAL
        </div>

        <nav className="flex-1 min-h-0 px-4 mt-2 space-y-1 overflow-y-auto custom-scrollbar">
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
                    className={`flex items-center justify-between px-4 py-3 text-sm rounded-xl transition-all duration-300 ${
                      (isActive || hasActiveSub)
                        ? 'shadow-neu-inset text-primary font-bold' 
                        : 'text-muted-foreground hover:shadow-neu-hover hover:-translate-y-0.5 hover:text-foreground'
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
                    className={`flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all duration-300 ${
                      isActive 
                        ? 'shadow-neu-inset text-primary font-bold' 
                        : 'text-muted-foreground hover:shadow-neu-hover hover:-translate-y-0.5 hover:text-foreground'
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
                          className={`block px-4 py-2 text-sm rounded-lg transition-all duration-300 whitespace-nowrap ${
                            isSubActive
                              ? 'text-primary font-bold shadow-neu-inset'
                              : 'text-muted-foreground hover:text-foreground hover:shadow-neu-hover hover:-translate-y-0.5'
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

        <div className="p-4 shrink-0 bg-background sticky bottom-0 z-10">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full px-4 py-3 text-sm text-destructive font-semibold rounded-xl transition-all duration-300 shadow-neu hover:shadow-neu-hover hover:-translate-y-0.5 active:translate-y-0 active:shadow-neu-inset"
          >
            <LogOut size={18} className="mr-2" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-background flex items-center px-4 sm:px-6 lg:px-8 justify-between shrink-0 shadow-neu z-10 relative">
          <div className="flex items-center">
            <button
              className="lg:hidden text-muted-foreground hover:text-foreground mr-4 p-2 rounded-lg shadow-neu active:shadow-neu-inset transition-all"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold text-foreground">
              {sidebarItems.find(i => pathname === i.href || (pathname?.startsWith(`${i.href}/`) ?? false))?.name || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full shadow-neu hover:shadow-neu-hover hover:-translate-y-0.5 active:shadow-neu-inset active:translate-y-0 text-primary transition-all duration-300 flex items-center justify-center"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            )}
            <div className="h-10 w-10 rounded-full flex items-center justify-center text-primary font-bold shadow-neu hover:shadow-neu-hover hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
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
