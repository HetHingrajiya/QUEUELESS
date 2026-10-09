"use client";
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { MapPin, Clock, Users, ArrowLeft, ArrowRight, CheckCircle2, Loader2, Info, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { calculateDistanceKm, formatDistance } from '@/lib/geo/distance';
import { CitizenOffice, CitizenService, ApiResponse } from '@/types/citizen';

export default function OfficeDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<{ office: CitizenOffice, services: CitizenService[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [togglingFav, setTogglingFav] = useState(false);

  useEffect(() => {
    const fetchOfficeDetails = async () => {
      try {
        const res = await fetch(`/api/citizen/offices/${id}`);
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
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-12 text-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl inline-block mb-4">
          <Info size={32} className="mx-auto mb-2" />
          <p>{error || 'Office not found'}</p>
        </div>
        <div>
          <Link href="/citizen/offices" className="text-blue-600 font-medium hover:underline">
            ← Back to Offices
          </Link>
        </div>
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
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/citizen/offices" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{office.name}</h1>
        </div>
        <button 
          onClick={toggleFavorite}
          className={`p-2 rounded-full transition-colors ${isFavorite ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400 hover:text-red-500'}`}
        >
          <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
          <div className="flex items-center text-emerald-600 mb-2">
            <CheckCircle2 size={18} className="mr-2" />
            <span className="font-semibold text-sm">Open Now</span>
          </div>
          <p className="text-xs text-slate-600">Standard operating hours</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <div className="flex items-center text-blue-600 mb-2">
            <Users size={18} className="mr-2" />
            <span className="font-semibold text-sm">{totalWaiting} Waiting</span>
          </div>
          <p className="text-xs text-slate-600">Total current queue</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start text-sm text-slate-600 space-x-3 mb-4">
          <MapPin size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <p>{office.address}</p>
        </div>
        
        {office.latitude != null && office.longitude != null && (
          <div className="flex items-center text-sm text-slate-600 space-x-3 border-t border-slate-100 pt-4">
            <MapPin size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 flex items-center justify-between">
              <span className="font-medium">{distStr || 'Distance unavailable'}</span>
              <a 
                href={`https://www.google.com/maps?q=${office.latitude},${office.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 font-medium hover:underline text-xs bg-blue-50 px-3 py-1.5 rounded-lg"
              >
                Get Directions
              </a>
            </div>
          </div>
        )}
        <div className="flex items-start text-sm text-slate-600 space-x-3 border-t border-slate-100 pt-4">
          <Clock size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="mb-1"><span className="font-medium">Active Counters:</span> {office.countersCount}</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4">Select Service</h2>
        
        {services.length > 0 ? (
          <div className="space-y-3">
            {services.map((service) => (
              <Link key={service._id} href={`/citizen/services/${service._id}`} className="block transition-transform hover:scale-[1.01]">
                <Card className="hover:border-blue-300 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">{service.name}</h3>
                      <div className="flex items-center text-xs text-slate-500 space-x-4">
                        <span className="flex items-center">
                          <Users size={14} className="mr-1" /> {service.waitingCount} waiting
                        </span>
                        <span className="flex items-center">
                          <Clock size={14} className="mr-1" /> ~{service.estimatedTime} min
                        </span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <ArrowRight size={18} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-slate-500">No services available at this office currently.</p>
          </div>
        )}
      </div>
    </div>
  );
}
