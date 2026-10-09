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
import { StatusBadge } from '@/components/common/StatusBadge';

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
}

export default function CitizenOfficesPage() {
  const [offices, setOffices] = useState<OfficeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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
  }, [search]);

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
    <div className="space-y-6 pb-12">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-slate-800">Find an Office</h2>
          {!userLocation && <Button variant="outline" size="sm" onClick={requestLocation}>Enable Location</Button>}
        </div>
        <p className="text-slate-500">Locate a government office to book your queue token.</p>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <Input
          type="text"
          placeholder="Search by name or location..."
          className="pl-10 h-12 rounded-xl text-slate-900 border-slate-200 focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {locationError && <p role="status" className="text-xs text-amber-700">{locationError}</p>}

      {loading ? (
        <LoadingState label="Loading government offices…" className="py-12" />
      ) : loadError ? (
        <ErrorState title="Could not load offices" description={loadError} onRetry={() => setSearch((current) => current)} />
      ) : offices.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {processedOffices.map((office) => (
            <Link key={office._id} href={`/citizen/offices/${office._id}`} className="block transition-transform hover:-translate-y-1">
              <Card className="hover:shadow-lg transition-shadow border-slate-200 overflow-hidden">
                <div className="h-24 bg-slate-100 flex items-center justify-center border-b border-slate-100">
                  <Building2 size={32} className="text-slate-300" />
                </div>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{office.name}</h3>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-slate-500 text-sm flex items-start">
                      <MapPin size={16} className="mr-2 text-slate-400 shrink-0 mt-0.5" /> 
                      <span className="line-clamp-2">{office.address || 'Address not provided'}</span>
                    </p>
                    <p className="text-slate-500 text-sm flex items-center">
                      <span className="font-medium mr-2 bg-slate-100 px-2 py-0.5 rounded text-xs">{office.distanceStr || "Distance unavailable"}</span>
                    </p>
                  </div>
                  
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <StatusBadge status={office.status || 'UNKNOWN'} />
                    <span className="text-sm font-medium text-blue-600 flex items-center">
                      View Services <ArrowRight size={16} className="ml-1" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No offices found"
          description="We couldn't find any offices matching your search. Try different keywords."
          icon={<Search className="h-8 w-8" />}
        />
      )}
    </div>
  );
}
