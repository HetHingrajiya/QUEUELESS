"use client";
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { MapPin, Clock, Users, ArrowLeft, ArrowRight, CheckCircle2, Heart } from 'lucide-react';
import { calculateDistanceKm, formatDistance } from '@/lib/geo/distance';
import { CitizenOffice, CitizenService, ApiResponse } from '@/types/citizen';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';

export default function OfficeDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<{ office: CitizenOffice, services: CitizenService[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [togglingFav, setTogglingFav] = useState(false);

  useEffect(() => {
    const fetchOfficeDetails = async () => {
      try {
        const res = await fetch(`/api/citizen/offices/${id}`);
        if (!res.ok) throw new Error(`Unable to load office details (${res.status})`);
        const json: ApiResponse<{ office: CitizenOffice; services: CitizenService[] }> = await res.json();
        
        if (json.success && json.data) {
          setData(json.data);
        } else {
          setError(json.message || 'Failed to load office details');
        }
      } catch (err: unknown) {
        setError('An error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOfficeDetails();

    // Try to get location silently if already granted
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        () => {} // Silent fail
      );
    }

    const checkFavoriteStatus = async () => {
      try {
        const res = await fetch(`/api/citizen/favorites?officeId=${id}`);
        const json = await res.json();
        if (json.success && json.data) {
          setIsFavorite(!!json.data.isFavorite);
        }
      } catch (e) {
        console.error('Failed to check favorite status', e);
      }
    };
    checkFavoriteStatus();
  }, [id, retryCount]);

  if (loading) {
    return <LoadingState label="Loading office details..." className="py-16" />;
  }

  if (error || !data) {
    return (
      <div className="py-12 space-y-6 flex flex-col items-center">
        <ErrorState description={error || 'Office not found'} onRetry={() => setRetryCount((count) => count + 1)} />
        <Link href="/citizen/offices" className="px-6 py-3 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset text-primary font-bold rounded-xl transition-all">
          ← Back to Offices
        </Link>
      </div>
    );
  }

  
  const { office, services } = data;
  let distStr = null;
  if (userLocation && office.latitude != null && office.longitude != null) {
    distStr = formatDistance(calculateDistanceKm(userLocation.lat, userLocation.lon, office.latitude, office.longitude));
  }

  const totalWaiting = services.reduce((acc, curr) => acc + (curr.waitingCount || 0), 0);

  const toggleFavorite = async () => {
    if (togglingFav) return;
    setTogglingFav(true);
    const nextState = !isFavorite;
    setIsFavorite(nextState);
    try {
      if (!nextState) {
        await fetch(`/api/citizen/favorites?officeId=${office._id}`, { method: 'DELETE' });
      } else {
        await fetch('/api/citizen/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ officeId: office._id })
        });
      }
    } catch (e) {
      console.error('Failed to toggle favorite', e);
      setIsFavorite(!nextState);
    } finally {
      setTogglingFav(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 cursor-default pt-2">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/citizen/offices" className="w-12 h-12 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-full transition-all text-muted-foreground hover:text-foreground shrink-0">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight tracking-tight">
            {office.name}
          </h1>
        </div>
        <button 
          onClick={toggleFavorite}
          className={`w-12 h-12 flex items-center justify-center rounded-full transition-all shrink-0 ${isFavorite ? 'bg-background shadow-neu-inset text-red-500' : 'bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset text-muted-foreground hover:text-red-500'}`}
        >
          <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} className="mt-0.5" />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-background shadow-neu-inset rounded-3xl p-5 sm:p-6 border-0">
          <div className="flex items-center text-primary mb-3">
            <div className="p-2 rounded-xl bg-background shadow-neu mr-3">
              <CheckCircle2 size={20} className="text-primary" />
            </div>
            <span className="font-extrabold text-sm sm:text-base text-foreground">Office Status</span>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
            {office.status === 'ACTIVE' ? 'Active & accepting bookings' : 'Currently unavailable'}
          </p>
        </div>
        <div className="bg-background shadow-neu-inset rounded-3xl p-5 sm:p-6 border-0">
          <div className="flex items-center text-primary mb-3">
            <div className="p-2 rounded-xl bg-background shadow-neu mr-3">
              <Users size={20} className="text-primary" />
            </div>
            <span className="font-extrabold text-sm sm:text-base text-foreground">{totalWaiting} Waiting</span>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground">Total current queue</p>
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-background shadow-neu rounded-3xl p-6 sm:p-8 border-0">
        <div className="flex items-start text-sm sm:text-base font-semibold text-muted-foreground space-x-4 mb-6">
          <div className="p-2 rounded-xl bg-background shadow-neu-inset shrink-0">
            <MapPin size={20} className="text-primary" />
          </div>
          <p className="pt-2">{office.address || 'Address not provided'}</p>
        </div>
        
        {office.latitude != null && office.longitude != null && (
          <div className="flex items-center justify-between text-sm sm:text-base text-muted-foreground border-t border-muted/10 pt-6 mt-2">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-xl bg-background shadow-neu-inset shrink-0">
                <MapPin size={20} className="text-primary" />
              </div>
              <span className="font-extrabold text-foreground">{distStr || 'Distance unavailable'}</span>
            </div>
            <a 
              href={`https://www.google.com/maps?q=${office.latitude},${office.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-bold hover:text-primary/80 text-xs sm:text-sm bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset px-4 sm:px-6 py-2.5 rounded-xl transition-all"
            >
              Directions
            </a>
          </div>
        )}
        <div className="flex items-start text-sm sm:text-base text-muted-foreground space-x-4 border-t border-muted/10 pt-6 mt-6">
          <div className="p-2 rounded-xl bg-background shadow-neu-inset shrink-0">
            <Clock size={20} className="text-primary" />
          </div>
          <div className="pt-2 font-semibold">
            <p className="mb-1"><span className="font-extrabold text-foreground">Active Counters:</span> {office.countersCount || 0}</p>
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="pt-2">
        <h2 className="text-2xl font-extrabold text-foreground mb-6">Select Service</h2>
        
        {services.length > 0 ? (
          <div className="space-y-4 sm:space-y-5">
            {services.map((service) => (
              <Link key={service._id} href={`/citizen/services/${service._id}`} className="block group">
                <div className="bg-background shadow-neu hover:shadow-neu-hover hover:-translate-y-1 active:translate-y-0 active:shadow-neu-inset rounded-3xl p-5 sm:p-6 transition-all duration-300 border-0 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-lg sm:text-xl text-foreground mb-3 group-hover:text-primary transition-colors">{service.name}</h3>
                    <div className="flex items-center text-xs sm:text-sm font-semibold text-muted-foreground space-x-4 sm:space-x-6">
                      <span className="flex items-center bg-background shadow-neu-inset px-3 py-1.5 rounded-lg">
                        <Users size={16} className="mr-2 text-primary" /> {service.waitingCount} waiting
                      </span>
                      <span className="flex items-center bg-background shadow-neu-inset px-3 py-1.5 rounded-lg">
                        <Clock size={16} className="mr-2 text-primary" /> ~{service.estimatedTime} min
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-background shadow-neu-inset text-primary flex items-center justify-center shrink-0">
                    <ArrowRight size={20} className="group-hover:scale-125 transition-transform duration-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-background shadow-neu-inset rounded-3xl border-0">
            <p className="text-lg font-bold text-muted-foreground">No services available at this office currently.</p>
          </div>
        )}
      </div>
    </div>
  );
}
