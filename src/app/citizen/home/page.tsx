"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, MapPin, Clock, ArrowRight, Ticket, 
  Layers, Compass, History, Sparkles, Building2, 
  Users, ChevronRight, ShieldCheck, Zap, Activity
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { calculateDistanceKm, formatDistance } from '@/lib/geo/distance';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { CitizenOffice, CitizenToken, ApiResponse } from '@/types/citizen';

export default function CitizenHome() {
  const router = useRouter();
  const [offices, setOffices] = useState<CitizenOffice[]>([]);
  const [activeToken, setActiveToken] = useState<CitizenToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const requestLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      () => {}
    );
  };

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const res = await fetch('/api/citizen/home');
        const json: ApiResponse<{ offices: CitizenOffice[]; activeToken: CitizenToken | null }> = await res.json();
        if (json.success && json.data) {
          setOffices(json.data.offices || []);
          setActiveToken(json.data.activeToken);
        }
      } catch (error: unknown) {
        console.error('Failed to load home data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/citizen/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/citizen/search');
    }
  };

  if (loading) {
    return (
      <div className="pt-2">
        <SkeletonLoader type="home" />
      </div>
    );
  }

  // Process offices with distance
  const processedOffices = offices.map(office => {
    let dist: number | null = null;
    if (userLocation && office.latitude != null && office.longitude != null) {
      dist = calculateDistanceKm(userLocation.lat, userLocation.lon, office.latitude, office.longitude);
    }
    return { ...office, distanceVal: dist, distanceStr: formatDistance(dist) };
  });

  if (userLocation) {
    processedOffices.sort((a, b) => {
      if (a.distanceVal === null && b.distanceVal === null) return 0;
      if (a.distanceVal === null) return 1;
      if (b.distanceVal === null) return -1;
      return a.distanceVal - b.distanceVal;
    });
  }

  return (
    <div className="space-y-6 pb-20 pt-1 font-sans">
      {/* Hero Banner with Modern GovTech Aesthetic */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 text-white p-6 sm:p-8 md:p-10 shadow-lg">
        {/* Subtle decorative glow circles */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-blue-100 text-xs font-semibold">
            <Sparkles size={13} className="text-amber-300" />
            <span>GovTech Smart Virtual Queue</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Don&apos;t wait in line.<br />
            <span className="text-blue-100">Arrive when it&apos;s your turn.</span>
          </h1>

          <p className="text-blue-100/90 text-xs sm:text-sm max-w-xl leading-relaxed">
            Take virtual tokens remotely, monitor queue progress in real-time, and receive smart departure alerts before you arrive.
          </p>

          {/* Integrated Search Box */}
          <form onSubmit={handleSearchSubmit} className="pt-2">
            <div className="relative flex items-center bg-white/95 backdrop-blur-md rounded-2xl p-1.5 shadow-lg border border-white/40 max-w-lg transition-all focus-within:ring-2 focus-within:ring-white">
              <Search className="h-4 w-4 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                placeholder="Search government service or office..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <Button
                type="submit"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 h-9 rounded-xl shadow-xs shrink-0"
              >
                Search
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Active Token Banner (With Fixed Badge Width & Typography) */}
      {activeToken && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/90 shadow-sm overflow-hidden transition-all hover:shadow-md">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Token Number Box - Fixed min-width to prevent any wrapping */}
              <div className="min-w-[80px] h-14 px-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-extrabold text-lg tracking-tight shadow-sm shrink-0 whitespace-nowrap">
                {activeToken.tokenNumber}
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    Active Queue Token
                  </span>
                  <Badge variant="outline" className="text-[10px] font-semibold text-slate-600 bg-white">
                    {activeToken.status || 'WAITING'}
                  </Badge>
                </div>

                <p className="font-extrabold text-base text-slate-900 truncate">
                  {activeToken.serviceName}
                </p>

                <p className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                  <Building2 size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{activeToken.officeName}</span>
                </p>
              </div>
            </div>

            <Link href={`/citizen/queue/${activeToken.id}`} className="shrink-0 self-end sm:self-center">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 font-bold text-xs h-9 px-4 shadow-xs flex items-center gap-1.5">
                <span>Live Tracker</span>
                <ArrowRight size={14} />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions (Interactive Modern Cards) */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Quick Actions
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link 
            href="/citizen/token" 
            className="group p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col items-center text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5 shadow-2xs group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Ticket size={22} />
            </div>
            <span className="text-xs font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">Get Token</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Book virtual pass</span>
          </Link>

          <Link 
            href="/citizen/queue/my" 
            className="group p-4 bg-white rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all flex flex-col items-center text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2.5 shadow-2xs group-hover:scale-105 group-hover:bg-amber-600 group-hover:text-white transition-all">
              <Layers size={22} />
            </div>
            <span className="text-xs font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors">My Queue</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Check live status</span>
          </Link>

          <Link 
            href="/citizen/offices" 
            className="group p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col items-center text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5 shadow-2xs group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <Compass size={22} />
            </div>
            <span className="text-xs font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors">Offices</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Explore locations</span>
          </Link>

          <Link 
            href="/citizen/token-history" 
            className="group p-4 bg-white rounded-2xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all flex flex-col items-center text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2.5 shadow-2xs group-hover:scale-105 group-hover:bg-purple-600 group-hover:text-white transition-all">
              <History size={22} />
            </div>
            <span className="text-xs font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors">History</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Past visit records</span>
          </Link>
        </div>
      </div>

      {/* Nearby Government Offices */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900">Government Offices</h2>
            {!userLocation && (
              <button
                onClick={requestLocation}
                className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200 transition-colors"
              >
                Enable GPS
              </button>
            )}
          </div>

          <Link href="/citizen/offices" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <span>View All ({offices.length})</span>
            <ChevronRight size={13} />
          </Link>
        </div>
        
        {offices.length > 0 ? (
          <div className="grid gap-3.5 sm:grid-cols-2">
            {processedOffices.slice(0, 4).map((office) => (
              <Link key={office._id} href={`/citizen/offices/${office._id}`} className="block group">
                <Card className="hover:shadow-md hover:border-blue-300 transition-all border-slate-200 bg-white rounded-2xl overflow-hidden h-full flex flex-col justify-between">
                  <CardContent className="p-4 sm:p-5 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Building2 size={20} />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {office.name}
                          </h3>
                          <p className="text-slate-500 text-xs flex items-center gap-1 truncate">
                            <MapPin size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate">
                              {userLocation && office.distanceStr ? `${office.distanceStr} • ` : ''}
                              {office.address || 'Government Complex'}
                            </span>
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        {office.status || 'ACTIVE'}
                      </span>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 text-[11px] font-medium">
                        {office.department || 'General Administration'}
                      </span>
                      <span className="text-blue-600 font-semibold text-[11px] flex items-center gap-1 group-hover:underline">
                        <span>Services</span>
                        <ArrowRight size={12} />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs p-6">
            <Building2 className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No Government Offices Found</p>
            <p className="text-slate-400 text-xs mt-0.5">Please check back later or contact your administrator.</p>
          </div>
        )}
      </div>

      {/* GovTech Feature Trust Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Verified Queuing</p>
            <p className="text-[11px] text-slate-400">Authorized official counter tokens</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Live Time Predictor</p>
            <p className="text-[11px] text-slate-400">Queue metrics & ML wait times</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-600 shrink-0">
            <Zap size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Turn Alert Prompts</p>
            <p className="text-[11px] text-slate-400">Smart reminders when called</p>
          </div>
        </div>
      </div>
    </div>
  );
}
