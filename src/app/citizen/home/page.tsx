"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, MapPin, Clock, ArrowRight, Ticket, 
  Layers, Compass, History, Sparkles, Building2, 
  Users 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { PushNotificationManager } from '@/components/common/PushNotificationManager';
import { calculateDistanceKm, formatDistance } from '@/lib/geo/distance';
import { Button } from '@/components/ui/button';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';

export default function CitizenHome() {
  const router = useRouter();
  const [offices, setOffices] = useState<any[]>([]);
  const [activeToken, setActiveToken] = useState<any>(null);
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
        const json = await res.json();
        if (json.success) {
          setOffices(json.data.offices || []);
          setActiveToken(json.data.activeToken);
        }
      } catch (error) {
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
    <div className="space-y-6 pb-20 pt-2">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-lg">
          <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-2.5 py-1 rounded-full text-blue-100">
            GovTech Smart Queuing
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-3 mb-2 tracking-tight">
            Don't wait in line.<br />Arrive when it's your turn.
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm mb-6 leading-relaxed">
            Take virtual tokens remotely, monitor queue progress in real-time, and get AI departure alerts.
          </p>
          
          <form onSubmit={handleSearchSubmit} className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search government service or office..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-20 h-11 rounded-xl text-slate-900 bg-white border-0 text-xs focus-visible:ring-2 focus-visible:ring-white shadow-sm"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-3 bg-blue-600 hover:bg-blue-700 text-xs font-semibold rounded-lg"
            >
              Search
            </Button>
          </form>
        </div>
      </div>

      {/* Active Token Card */}
      {activeToken ? (
        <Card className="border-blue-200 shadow-sm bg-gradient-to-r from-blue-50/80 to-indigo-50/80 overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 pr-3">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                {activeToken.tokenNumber}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-100 px-2 py-0.5 rounded-full">
                  Active Queue Token
                </span>
                <p className="font-bold text-sm text-slate-900 mt-1 truncate">{activeToken.serviceName}</p>
                <p className="text-xs text-slate-500 truncate">{activeToken.officeName}</p>
              </div>
            </div>
            <Link href={`/citizen/queue/${activeToken.id}`} className="shrink-0">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 font-bold text-xs shadow-xs">
                Live Track <ArrowRight size={13} className="ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {/* Quick Actions Grid (Section 11) */}
      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-2.5">
          <Link href="/citizen/token" className="p-3 bg-white rounded-2xl border border-slate-200 text-center hover:border-blue-300 hover:shadow-xs transition-all flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5 shadow-2xs">
              <Ticket size={18} />
            </div>
            <span className="text-[11px] font-bold text-slate-800">Get Token</span>
          </Link>

          <Link href="/citizen/queue/my" className="p-3 bg-white rounded-2xl border border-slate-200 text-center hover:border-blue-300 hover:shadow-xs transition-all flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5 shadow-2xs">
              <Layers size={18} />
            </div>
            <span className="text-[11px] font-bold text-slate-800">My Queue</span>
          </Link>

          <Link href="/citizen/offices" className="p-3 bg-white rounded-2xl border border-slate-200 text-center hover:border-blue-300 hover:shadow-xs transition-all flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5 shadow-2xs">
              <Compass size={18} />
            </div>
            <span className="text-[11px] font-bold text-slate-800">Offices</span>
          </Link>

          <Link href="/citizen/token-history" className="p-3 bg-white rounded-2xl border border-slate-200 text-center hover:border-blue-300 hover:shadow-xs transition-all flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5 shadow-2xs">
              <History size={18} />
            </div>
            <span className="text-[11px] font-bold text-slate-800">History</span>
          </Link>
        </div>
      </div>

      {/* Nearby Offices Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-extrabold text-slate-900">Nearby Government Offices</h2>
            {!userLocation && (
              <button
                onClick={requestLocation}
                className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200 transition-colors"
              >
                Enable GPS
              </button>
            )}
          </div>
          <Link href="/citizen/offices" className="text-xs font-bold text-blue-600 hover:text-blue-700">
            View All ({offices.length})
          </Link>
        </div>
        
        {offices.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {processedOffices.slice(0, 4).map((office: any) => (
              <Link key={office._id} href={`/citizen/offices/${office._id}`} className="block transition-transform hover:-translate-y-0.5">
                <Card className="hover:shadow-xs transition-shadow border-slate-200 bg-white">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 pr-2">
                        <h3 className="font-bold text-sm text-slate-900 truncate">{office.name}</h3>
                        <p className="text-slate-400 text-xs flex items-center mt-0.5 truncate">
                          <MapPin size={12} className="mr-1 shrink-0 text-slate-400" />
                          <span className="truncate">{office.distanceStr || office.address}</span>
                        </p>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        {office.status || 'OPEN'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 text-[11px]">
                        {office.department || 'General Administration'}
                      </span>
                      <span className="text-blue-600 font-semibold text-[11px] flex items-center">
                        Services <ArrowRight size={11} className="ml-1" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
            No government offices registered yet.
          </div>
        )}
      </div>
    </div>
  );
}
