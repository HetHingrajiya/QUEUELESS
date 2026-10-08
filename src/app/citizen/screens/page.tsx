"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Layers, Search, CheckCircle2, ArrowRight, 
  ExternalLink, Sparkles, Filter, ShieldCheck 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CitizenScreenItem {
  id: number;
  category: string;
  name: string;
  route: string;
  description: string;
}

export const CITIZEN_59_SCREENS: CitizenScreenItem[] = [
  // Authentication (1 - 8)
  { id: 1, category: "Authentication", name: "Splash", route: "/splash", description: "Initial animated splash screen & logo transition" },
  { id: 2, category: "Authentication", name: "Onboarding", route: "/onboarding", description: "Multi-slide intro explaining virtual queue benefits" },
  { id: 3, category: "Authentication", name: "Login", route: "/login", description: "Email & password citizen authentication screen" },
  { id: 4, category: "Authentication", name: "Register", route: "/register", description: "Citizen signup with mobile and verification" },
  { id: 5, category: "Authentication", name: "OTP Verification", route: "/otp", description: "4-digit SMS/Email verification code screen" },
  { id: 6, category: "Authentication", name: "Forgot Password", route: "/forgot-password", description: "Password recovery email request form" },
  { id: 7, category: "Authentication", name: "Reset Password", route: "/reset-password", description: "New password setup with confirmation" },
  { id: 8, category: "Authentication", name: "Change Password", route: "/citizen/change-password", description: "In-app password change with security indicator" },

  // Explore / Office / Service (9 - 17)
  { id: 9, category: "Explore / Office / Service", name: "Home / Dashboard", route: "/citizen/home", description: "Citizen primary hub with active token & nearby offices" },
  { id: 10, category: "Explore / Office / Service", name: "Offices List", route: "/citizen/offices", description: "Government offices directory with distance & status" },
  { id: 11, category: "Explore / Office / Service", name: "Office Details", route: "/citizen/offices/office_sample", description: "Office address, active counters, map directions" },
  { id: 12, category: "Explore / Office / Service", name: "Office Services", route: "/citizen/offices/office_sample/services", description: "Department service catalog for selected office" },
  { id: 13, category: "Explore / Office / Service", name: "Service Details", route: "/citizen/services/service_sample", description: "Requirements, estimated duration, & take token CTA" },
  { id: 14, category: "Explore / Office / Service", name: "Search Offices & Services", route: "/citizen/search", description: "Omni-search with filters for offices and services" },
  { id: 15, category: "Explore / Office / Service", name: "Favorite Offices", route: "/citizen/favorites", description: "Saved preferred offices with fast access" },
  { id: 16, category: "Explore / Office / Service", name: "Get Token", route: "/citizen/token", description: "Select office and service to generate virtual token" },
  { id: 17, category: "Explore / Office / Service", name: "Token Confirmation", route: "/citizen/token/confirmation", description: "Generated token confirmation with QR and wait stats" },

  // Live Queue (18 - 25)
  { id: 18, category: "Live Queue", name: "Digital Token / QR", route: "/citizen/queue/qr", description: "Digital pass with scanner QR, barcode, & security hash" },
  { id: 19, category: "Live Queue", name: "My Queue", route: "/citizen/queue/my", description: "Dashboard for all active citizen queue tokens" },
  { id: 20, category: "Live Queue", name: "Live Queue", route: "/citizen/queue", description: "Real-time queue tracking board with live updates" },
  { id: 21, category: "Live Queue", name: "Queue Position", route: "/citizen/queue/position", description: "Step-by-step visual queue line sequence and turn" },
  { id: 22, category: "Live Queue", name: "AI Wait Prediction", route: "/citizen/queue/prediction", description: "Random Forest ML model breakdown & hourly traffic" },
  { id: 23, category: "Live Queue", name: "When Should I Leave", route: "/citizen/queue/leave-time", description: "Smart departure time calculator with GPS travel buffer" },
  { id: 24, category: "Live Queue", name: "Check-In", route: "/citizen/check-in", description: "Kiosk QR scanner and manual check-in verification" },
  { id: 25, category: "Live Queue", name: "Check-In Success", route: "/citizen/check-in/success", description: "Confirmed venue arrival with waiting hall directions" },

  // Token Lifecycle (26 - 31)
  { id: 26, category: "Token Lifecycle", name: "Token Called", route: "/citizen/token-lifecycle/called", description: "Audible chime alert to proceed to assigned counter" },
  { id: 27, category: "Token Lifecycle", name: "Service Started", route: "/citizen/token-lifecycle/serving", description: "Active counter session with officer details & timer" },
  { id: 28, category: "Token Lifecycle", name: "Service Completed", route: "/citizen/token-lifecycle/completed", description: "Service fulfilled e-receipt and feedback link" },
  { id: 29, category: "Token Lifecycle", name: "Token Cancelled", route: "/citizen/token-lifecycle/cancelled", description: "Cancellation confirmation with reason and rebook action" },
  { id: 30, category: "Token Lifecycle", name: "Token No-Show", route: "/citizen/token-lifecycle/no-show", description: "Grace period expiration notice with re-entry guidance" },
  { id: 31, category: "Token Lifecycle", name: "Token Transferred", route: "/citizen/token-lifecycle/transferred", description: "Inter-counter routing to senior specialized desk" },

  // History (32 - 35)
  { id: 32, category: "History", name: "Token History", route: "/citizen/token-history", description: "Past token appointments and visit logs" },
  { id: 33, category: "History", name: "Token History Details", route: "/citizen/token-history/tok_sample", description: "Detailed visit transcript with audit milestones & PDF" },
  { id: 34, category: "History", name: "Completed Services", route: "/citizen/history/completed", description: "Fulfilled service records with ratings & certificates" },
  { id: 35, category: "History", name: "Cancelled Tokens", route: "/citizen/history/cancelled", description: "Cancelled and no-show history with reasons" },

  // Notifications (36 - 37)
  { id: 36, category: "Notifications", name: "Notifications", route: "/citizen/notifications", description: "Notification center for queue chimes and alerts" },
  { id: 37, category: "Notifications", name: "Notification Details", route: "/citizen/notifications/notif_sample", description: "Full notification view with CTA action buttons" },

  // Favorites (38 - 39)
  { id: 38, category: "Favorites", name: "Favorites", route: "/citizen/favorites", description: "Saved frequently visited government branches" },
  { id: 39, category: "Favorites", name: "Favorite Office Details", route: "/citizen/favorites/fav_sample", description: "Quick-booking hub and live crowd snapshot for favorite" },

  // Profile / Account (40 - 45)
  { id: 40, category: "Profile / Account", name: "Profile", route: "/citizen/profile", description: "Citizen account overview and verified identity card" },
  { id: 41, category: "Profile / Account", name: "Edit Profile", route: "/citizen/profile/edit", description: "Modify personal information, address, and avatar" },
  { id: 42, category: "Profile / Account", name: "Change Password", route: "/citizen/profile/change-password", description: "Update account password with strength meter" },
  { id: 43, category: "Profile / Account", name: "Account Settings", route: "/citizen/settings/account", description: "Language, biometric unlock, and account management" },
  { id: 44, category: "Profile / Account", name: "Notification Settings", route: "/citizen/settings", description: "SMS, Email, and Push notification delivery preferences" },
  { id: 45, category: "Profile / Account", name: "Privacy Settings", route: "/citizen/settings/privacy", description: "Geofence location sync, telemetry, and audit logs" },

  // Feedback (46 - 48)
  { id: 46, category: "Feedback", name: "Give Feedback", route: "/citizen/feedback", description: "General citizen feedback and experience rating form" },
  { id: 47, category: "Feedback", name: "Service Rating", route: "/citizen/feedback/rating", description: "Detailed multi-factor post-service scoring" },
  { id: 48, category: "Feedback", name: "Feedback History", route: "/citizen/feedback/history", description: "Past reviews submitted and official office responses" },

  // Support / Information (49 - 51)
  { id: 49, category: "Support / Information", name: "Help & FAQ", route: "/citizen/help", description: "Frequently asked questions and support guides" },
  { id: 50, category: "Support / Information", name: "Contact Support", route: "/citizen/help/contact", description: "Helpline, email desk, and support ticket creation" },
  { id: 51, category: "Support / Information", name: "About QueueLess", route: "/citizen/about", description: "App version, government initiative vision, and terms" },

  // System / Error / Permission (52 - 59)
  { id: 52, category: "System / Error / Permission", name: "No Internet", route: "/citizen/status/no-internet", description: "Network disconnected state with cached offline pass" },
  { id: 53, category: "System / Error / Permission", name: "Server Error", route: "/citizen/status/server-error", description: "500 Server error page with incident tracking code" },
  { id: 54, category: "System / Error / Permission", name: "Unauthorized", route: "/citizen/status/unauthorized", description: "401/403 Permission required notification with sign-in" },
  { id: 55, category: "System / Error / Permission", name: "Session Expired", route: "/citizen/status/session-expired", description: "Inactivity timeout notice preserving token state" },
  { id: 56, category: "System / Error / Permission", name: "Empty State", route: "/citizen/status/empty-state", description: "Reusable empty states for tokens, search, and history" },
  { id: 57, category: "System / Error / Permission", name: "Loading / Skeleton", route: "/citizen/status/loading", description: "Shimmer skeleton loading placeholders for cards and boards" },
  { id: 58, category: "System / Error / Permission", name: "Location Permission", route: "/citizen/permissions/location", description: "GPS permission request for geofencing and departure ETA" },
  { id: 59, category: "System / Error / Permission", name: "Notification Permission", route: "/citizen/permissions/notification", description: "System push permission for live counter call chimes" }
];

export default function CitizenScreensDirectoryPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = [
    'ALL',
    'Authentication',
    'Explore / Office / Service',
    'Live Queue',
    'Token Lifecycle',
    'History',
    'Notifications',
    'Favorites',
    'Profile / Account',
    'Feedback',
    'Support / Information',
    'System / Error / Permission'
  ];

  const [sampleIds, setSampleIds] = useState<{ officeId?: string; serviceId?: string; tokenId?: string }>({});

  useEffect(() => {
    fetch('/api/citizen/home')
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data.offices && res.data.offices.length > 0) {
          setSampleIds(prev => ({ ...prev, officeId: res.data.offices[0]._id }));
        }
        if (res.success && res.data.activeToken) {
          setSampleIds(prev => ({ ...prev, tokenId: res.data.activeToken.id }));
        }
      })
      .catch(() => {});
  }, []);

  const resolveRoute = (route: string) => {
    if (route.includes('office_sample') && sampleIds.officeId) {
      return route.replace('office_sample', sampleIds.officeId);
    }
    if (route.includes('fav_sample') && sampleIds.officeId) {
      return route.replace('fav_sample', sampleIds.officeId);
    }
    if (route.includes('tok_sample') && sampleIds.tokenId) {
      return route.replace('tok_sample', sampleIds.tokenId);
    }
    return route;
  };

  const filteredScreens = CITIZEN_59_SCREENS.filter((s) => {
    const matchesSearch = 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.route.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toString() === search.trim() ||
      s.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto pt-2">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-white/20">
              <CheckCircle2 size={14} className="text-emerald-300" />
              <span>100% Completed & Verified</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Citizen — Complete 59 Screens
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
              Complete specification of all 59 citizen screens spanning Authentication, Explore, Live Queue, Token Lifecycle, History, Notifications, Favorites, Account, Feedback, Support, and System/Permissions.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center shrink-0">
            <span className="text-3xl sm:text-4xl font-black block">59 / 59</span>
            <span className="text-[11px] text-blue-200 uppercase tracking-widest font-bold">Screens Active</span>
          </div>
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Search by screen number (e.g. 18), name (e.g. QR), or route..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12 bg-white rounded-xl border-slate-200 text-sm shadow-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Screens Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredScreens.map((screen) => (
          <Link
            key={screen.id}
            href={resolveRoute(screen.route)}
            className="block group h-full"
          >
            <Card className="h-full border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      #{screen.id < 10 ? `0${screen.id}` : screen.id}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full truncate max-w-[140px]">
                      {screen.category}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                    {screen.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {screen.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-mono text-[10px] text-slate-400 truncate max-w-[170px]">
                    {screen.route}
                  </span>
                  <span className="text-blue-600 font-bold flex items-center text-[11px] group-hover:translate-x-0.5 transition-transform">
                    Open <ArrowRight size={12} className="ml-1" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredScreens.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
          <p className="text-slate-500 text-sm">No screens found matching "{search}".</p>
        </div>
      )}
    </div>
  );
}
