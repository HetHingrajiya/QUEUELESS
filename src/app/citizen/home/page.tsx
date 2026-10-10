"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, MapPin, Clock, ArrowRight, Ticket, 
  Layers, Compass, History, Sparkles, Building2, 
  ShieldCheck, Zap, ChevronRight
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
        if (res.status === 401) {
          // Not authenticated, redirect to login
          router.replace('/login');
          return;
        }
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
    <div className="space-y-8 pb-10 pt-1 font-sans cursor-default">
      {/* Hero Banner - Neumorphic Style */}
      <div className="relative overflow-hidden rounded-3xl bg-background shadow-neu p-6 sm:p-8 md:p-10 border-0">
        <div className="relative z-10 max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background shadow-neu-inset text-primary text-xs font-bold tracking-wide">
            <Sparkles size={14} className="text-primary" />
            <span>GovTech Smart Virtual Queue</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            Don&apos;t wait in line.<br />
            <span className="text-muted-foreground">Arrive when it&apos;s your turn.</span>
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base max-w-xl font-medium">
            Take virtual tokens remotely, monitor queue progress in real-time, and receive smart departure alerts before you arrive.
          </p>

          {/* Search Box - Neumorphic Inset Groove */}
          <form onSubmit={handleSearchSubmit} className="pt-4">
            <div className="relative flex items-center bg-background rounded-2xl p-2 shadow-neu-inset max-w-lg transition-all focus-within:ring-2 focus-within:ring-primary/20">
              <Search className="h-5 w-5 text-muted-foreground ml-3 shrink-0" />
              <input
                type="text"
                placeholder="Search government service or office..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-sm text-foreground font-semibold placeholder:text-muted-foreground/70 focus:outline-none cursor-text"
              />
              <Button
                type="submit"
                size="sm"
                className="bg-background text-primary hover:text-primary/80 font-bold text-sm px-6 h-10 rounded-xl shadow-neu hover:shadow-neu-hover hover:-translate-y-0.5 active:translate-y-0 active:shadow-neu-inset transition-all shrink-0 border-0"
              >
                Search
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Active Token Banner */}
      {activeToken && (
        <div className="bg-background rounded-3xl shadow-neu p-6 border-0 transition-all hover:shadow-neu-hover">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5 min-w-0">
              {/* Token Number Box - Inset Groove */}
              <div className="w-20 h-20 rounded-2xl bg-background shadow-neu-inset text-primary flex items-center justify-center font-black text-3xl tracking-tighter shrink-0 whitespace-nowrap">
                {activeToken.tokenNumber}
              </div>

              <div className="min-w-0 space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-background shadow-neu text-primary">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Active Token
                  </span>
                  <Badge variant="outline" className="text-xs font-bold text-muted-foreground bg-background shadow-neu-inset border-0 px-3 py-1">
                    {activeToken.status || 'WAITING'}
                  </Badge>
                </div>

                <p className="font-extrabold text-xl text-foreground truncate">
                  {activeToken.serviceName}
                </p>

                <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2 truncate">
                  <Building2 size={16} className="text-muted-foreground/70 shrink-0" />
                  <span className="truncate">{activeToken.officeName}</span>
                </p>
              </div>
            </div>

            <Link href={`/citizen/queue/${activeToken.id}`} className="shrink-0 self-start sm:self-center">
              <Button size="lg" className="bg-background text-primary font-bold shadow-neu hover:shadow-neu-hover hover:-translate-y-0.5 active:translate-y-0 active:shadow-neu-inset transition-all border-0 rounded-xl px-6 flex items-center gap-2">
                <span>Live Tracker</span>
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Quick Actions (Neumorphic Grid) */}
      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground px-2">
          Quick Actions
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <Link 
            href="/citizen/token" 
            className="group p-5 bg-background rounded-3xl shadow-neu hover:shadow-neu-hover hover:-translate-y-1 active:translate-y-0 active:shadow-neu-inset transition-all duration-300 flex flex-col items-center text-center border-0"
          >
            <div className="w-14 h-14 rounded-2xl bg-background shadow-neu-inset text-primary flex items-center justify-center mb-4 transition-all duration-300">
              <Ticket size={24} className="group-hover:scale-110 transition-transform duration-300" />
            </div>
            <span className="text-sm font-extrabold text-foreground transition-colors">Get Token</span>
            <span className="text-xs font-semibold text-muted-foreground mt-1">Book virtual pass</span>
          </Link>

          <Link 
            href="/citizen/queue/my" 
            className="group p-5 bg-background rounded-3xl shadow-neu hover:shadow-neu-hover hover:-translate-y-1 active:translate-y-0 active:shadow-neu-inset transition-all duration-300 flex flex-col items-center text-center border-0"
          >
            <div className="w-14 h-14 rounded-2xl bg-background shadow-neu-inset text-primary flex items-center justify-center mb-4 transition-all duration-300">
              <Layers size={24} className="group-hover:scale-110 transition-transform duration-300" />
            </div>
            <span className="text-sm font-extrabold text-foreground transition-colors">My Queue</span>
            <span className="text-xs font-semibold text-muted-foreground mt-1">Check live status</span>
          </Link>

          <Link 
            href="/citizen/offices" 
            className="group p-5 bg-background rounded-3xl shadow-neu hover:shadow-neu-hover hover:-translate-y-1 active:translate-y-0 active:shadow-neu-inset transition-all duration-300 flex flex-col items-center text-center border-0"
          >
            <div className="w-14 h-14 rounded-2xl bg-background shadow-neu-inset text-primary flex items-center justify-center mb-4 transition-all duration-300">
              <Compass size={24} className="group-hover:scale-110 transition-transform duration-300" />
            </div>
            <span className="text-sm font-extrabold text-foreground transition-colors">Offices</span>
            <span className="text-xs font-semibold text-muted-foreground mt-1">Explore locations</span>
          </Link>

          <Link 
            href="/citizen/token-history" 
            className="group p-5 bg-background rounded-3xl shadow-neu hover:shadow-neu-hover hover:-translate-y-1 active:translate-y-0 active:shadow-neu-inset transition-all duration-300 flex flex-col items-center text-center border-0"
          >
            <div className="w-14 h-14 rounded-2xl bg-background shadow-neu-inset text-primary flex items-center justify-center mb-4 transition-all duration-300">
              <History size={24} className="group-hover:scale-110 transition-transform duration-300" />
            </div>
            <span className="text-sm font-extrabold text-foreground transition-colors">History</span>
            <span className="text-xs font-semibold text-muted-foreground mt-1">Past visit records</span>
          </Link>
        </div>
      </div>

      {/* Nearby Government Offices */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-foreground">Government Offices</h2>
            {!userLocation && (
              <button
                onClick={requestLocation}
                className="text-xs font-bold text-primary bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset px-4 py-1.5 rounded-full transition-all border-0"
              >
                Enable GPS
              </button>
            )}
          </div>

          <Link href="/citizen/offices" className="text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5">
            <span>View All ({offices.length})</span>
            <ChevronRight size={16} />
          </Link>
        </div>
        
        {offices.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {processedOffices.slice(0, 4).map((office) => (
              <Link key={office._id} href={`/citizen/offices/${office._id}`} className="block group">
                <div className="bg-background rounded-3xl p-6 shadow-neu hover:shadow-neu-hover hover:-translate-y-1 active:translate-y-0 transition-all duration-300 h-full flex flex-col justify-between border-0">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-background shadow-neu-inset text-primary flex items-center justify-center shrink-0">
                          <Building2 size={20} className="group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <h3 className="font-extrabold text-base text-foreground group-hover:text-primary transition-colors truncate">
                            {office.name}
                          </h3>
                          <p className="text-muted-foreground font-semibold text-xs flex items-center gap-1.5 truncate">
                            <MapPin size={14} className="shrink-0" />
                            <span className="truncate">
                              {userLocation && office.distanceStr ? `${office.distanceStr} • ` : ''}
                              {office.address || 'Government Complex'}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="text-xs font-black px-3 py-1 rounded-full bg-background shadow-neu-inset text-primary shrink-0">
                        {office.status || 'ACTIVE'}
                      </div>
                    </div>

                    <div className="pt-4 flex items-center justify-between">
                      <span className="text-muted-foreground font-bold text-xs uppercase tracking-wide">
                        {office.department || 'General Admin'}
                      </span>
                      <span className="text-primary font-bold text-xs flex items-center gap-1.5">
                        <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">View</span>
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-background rounded-3xl shadow-neu-inset text-muted-foreground border-0">
            <Building2 className="mx-auto h-12 w-12 opacity-50 mb-4" />
            <p className="font-black text-lg text-foreground">No Offices Found</p>
            <p className="font-semibold mt-1">Please check back later or contact your administrator.</p>
          </div>
        )}
      </div>

      {/* GovTech Feature Trust Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-6">
        <div className="flex items-center gap-4 p-5 rounded-3xl bg-background shadow-neu transition-all hover:shadow-neu-hover hover:-translate-y-1 border-0">
          <div className="p-3 rounded-2xl bg-background shadow-neu-inset text-primary shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-sm font-extrabold text-foreground">Verified Queuing</p>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">Authorized tokens</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-5 rounded-3xl bg-background shadow-neu transition-all hover:shadow-neu-hover hover:-translate-y-1 border-0">
          <div className="p-3 rounded-2xl bg-background shadow-neu-inset text-primary shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-extrabold text-foreground">Live Predictor</p>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">ML wait times</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-5 rounded-3xl bg-background shadow-neu transition-all hover:shadow-neu-hover hover:-translate-y-1 border-0">
          <div className="p-3 rounded-2xl bg-background shadow-neu-inset text-primary shrink-0">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-sm font-extrabold text-foreground">Turn Alerts</p>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">Smart reminders</p>
          </div>
        </div>
      </div>
    </div>
  );
}
