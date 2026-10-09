"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Layers, Clock, User, LogOut, Menu, X, Bell } from 'lucide-react';

const mainNavItems = [
  { name: 'Home', href: '/citizen/home', icon: <Home size={22} /> },
  { name: 'Explore', href: '/citizen/offices', icon: <Compass size={22} /> },
  { name: 'My Queue', href: '/citizen/queue/my', icon: <Layers size={22} /> },
  { name: 'History', href: '/citizen/token-history', icon: <Clock size={22} /> },
  { name: 'Profile', href: '/citizen/profile', icon: <User size={22} /> },
];

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentPath = pathname || '';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-6">
      {/* Top Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/citizen/home" className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              QueueLess
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {mainNavItems.map((item) => {
              const isActive = currentPath === item.href || (item.href !== '/citizen/home' && currentPath.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-1.5 text-sm font-semibold transition-all px-2.5 py-1.5 rounded-lg ${
                    isActive ? 'text-blue-600 bg-blue-50/80 shadow-xs' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
            <Link
              href="/citizen/notifications"
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors relative"
              title="Notifications"
            >
              <Bell size={20} />
            </Link>
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </nav>

          {/* Mobile Menu & Notification Header Actions */}
          <div className="flex items-center space-x-2 md:hidden">
            <Link
              href="/citizen/notifications"
              className="p-2 text-slate-600 hover:text-blue-600 rounded-lg"
            >
              <Bell size={22} />
            </Link>
            <button 
              className="p-2 text-slate-600 hover:text-slate-900"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Top Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 shadow-xl z-40 p-4 space-y-2 animate-in slide-in-from-top-2 duration-150">
          <Link
            href="/citizen/search"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 p-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm"
          >
            <Compass size={18} className="text-slate-500" /> Search Offices & Services
          </Link>
          <Link
            href="/citizen/favorites"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 p-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm"
          >
            <span className="text-amber-500 font-bold">★</span> Bookmarked Favorites
          </Link>
          <Link
            href="/citizen/help"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 p-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm"
          >
            <span className="text-slate-500 font-bold">?</span> Help & Support
          </Link>
          <div className="pt-2 border-t border-slate-100">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 p-3 text-red-600 hover:bg-red-50 rounded-xl font-medium text-sm text-left transition-colors"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:py-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation (5 tabs per spec) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 flex justify-around items-center h-16 z-50 shadow-lg">
        {mainNavItems.map((item) => {
          const isActive = currentPath === item.href || (item.href !== '/citizen/home' && currentPath.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full py-1 transition-colors ${
                isActive ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium hover:text-slate-800'
              }`}
            >
              {React.cloneElement(item.icon as React.ReactElement<{ size: number }>, { size: 20 })}
              <span className="text-[10px] mt-0.5 tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
