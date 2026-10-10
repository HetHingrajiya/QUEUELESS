"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Building2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { calculateDistanceKm, formatDistance } from '@/lib/geo/distance';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';

interface OfficeItem {
  _id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number | null;
  longitude?: number | null;
  status?: string;
  statusColor?: string;
  department?: string;
}

export default function CitizenOfficesPage() {
  const [offices, setOffices] = useState<OfficeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
        setLocationError(null);
      },
      () => {
        setLocationError('Enable location to see distance from nearby offices.');
      }
    );
  };

  useEffect(() => {
    const fetchOffices = async () => {
      setLoading(true);
      try {
        const url = search ? `/api/citizen/offices?search=${encodeURIComponent(search)}` : '/api/citizen/offices';
        const res = await fetch(url);
        const json = await res.json();
        if (!res.ok || !json.success || !Array.isArray(json.data)) {
          throw new Error(json.message || 'Unable to load offices. Please try again.');
        }
        setOffices(json.data);
        setLoadError(null);
      } catch (error) {
        console.error('Failed to fetch offices:', error);
        setLoadError(error instanceof Error ? error.message : 'Unable to load offices. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    // Add a small debounce for search
    const timer = setTimeout(() => {
      fetchOffices();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, retryCount]);

  const processedOffices = offices.map((office) => {
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
    <div className="space-y-8 pb-12 cursor-default pt-2">
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-extrabold text-foreground">Explore Offices</h2>
          {!userLocation && (
            <button 
              onClick={requestLocation}
              className="text-xs font-bold text-primary bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset px-4 py-2 rounded-full transition-all border-0"
            >
              Enable GPS
            </button>
          )}
        </div>
        <p className="text-muted-foreground font-medium text-sm">Find and locate government offices near you to book a virtual queue pass.</p>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <Input
          type="text"
          placeholder="Search by name, department, or location..."
          className="pl-12 h-14 rounded-2xl bg-background shadow-neu-inset border-0 text-foreground font-semibold placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {locationError && (
        <div className="bg-background shadow-neu-inset text-destructive font-semibold px-4 py-3 rounded-xl text-sm">
          {locationError}
        </div>
      )}

      {loading ? (
        <LoadingState label="Searching offices…" className="py-12" />
      ) : loadError ? (
        <ErrorState title="Could not load offices" description={loadError} onRetry={() => { setLoading(true); setRetryCount((count) => count + 1); }} />
      ) : offices.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {processedOffices.map((office) => (
            <Link key={office._id} href={`/citizen/offices/${office._id}`} className="block group">
              <div className="bg-background rounded-3xl p-6 shadow-neu hover:shadow-neu-hover hover:-translate-y-1 active:translate-y-0 active:shadow-neu-inset transition-all duration-300 h-full flex flex-col justify-between border-0">
                <div className="space-y-4">
                  {/* Top section with Icon and Status */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-background shadow-neu-inset text-primary flex items-center justify-center shrink-0">
                      <Building2 size={24} className="group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="text-[10px] font-black px-3 py-1 rounded-full bg-background shadow-neu-inset text-primary shrink-0 uppercase tracking-widest">
                      {office.status || 'ACTIVE'}
                    </div>
                  </div>

                  {/* Title and Distance */}
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                      {office.name}
                    </h3>
                    <p className="text-muted-foreground font-semibold text-xs flex items-start gap-1.5 line-clamp-2">
                      <MapPin size={14} className="shrink-0 mt-0.5" />
                      <span>{office.address || 'Government Complex'}</span>
                    </p>
                    {userLocation && office.distanceStr && (
                      <div className="inline-flex mt-1 items-center px-2.5 py-1 rounded-md bg-background shadow-neu-inset text-xs font-bold text-muted-foreground">
                        {office.distanceStr}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="pt-4 mt-auto flex items-center justify-between border-t border-muted/10">
                    <span className="text-muted-foreground font-bold text-xs uppercase tracking-wide truncate pr-2">
                      {office.department || 'General Admin'}
                    </span>
                    <span className="text-primary font-bold text-xs flex items-center gap-1.5 shrink-0">
                      <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">View Services</span>
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No offices found"
          description="We couldn't find any offices matching your search. Try different keywords."
          icon={<Search className="h-10 w-10 text-muted-foreground/50" />}
        />
      )}
    </div>
  );
}
