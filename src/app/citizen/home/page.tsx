"use client";
import Link from 'next/link';
import { Search, MapPin, Clock, ArrowRight, User, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { PushNotificationManager } from '@/components/common/PushNotificationManager';
import { calculateDistanceKm, formatDistance } from '@/lib/geo/distance';
import { Button } from '@/components/ui/button';

export default function CitizenHome() {
  const [offices, setOffices] = useState<any[]>([]);
  const [activeToken, setActiveToken] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  
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
      (error) => {
        setLocationError('Enable location to see distance from nearby offices.');
      }
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
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
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10">
          <Clock size={200} />
        </div>
        <div className="relative z-10 max-w-lg">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
            Don't wait in line.<br />Arrive when it's your turn.
          </h1>
          <p className="text-blue-100 mb-8 text-lg">
            Smart queue management for government offices. Book a virtual token and track your turn in real-time.
          </p>
          
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <Input
              type="text"
              placeholder="Search government service or office..."
              className="pl-10 h-12 rounded-xl text-slate-900 border-0 focus:ring-4 focus:ring-blue-300"
            />
          </div>
        </div>
      </div>

      {/* Active Token Section */}
      {activeToken ? (
        <Card className="border-blue-200 shadow-blue-50 bg-blue-50/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm">
                {activeToken.tokenNumber}
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Active Token</p>
                <p className="font-medium text-slate-900">{activeToken.serviceName} - {activeToken.officeName}</p>
              </div>
            </div>
            <Link href={`/citizen/queue/${activeToken.id}`} className="flex items-center text-sm font-medium text-blue-700 hover:text-blue-800 bg-white px-3 py-2 rounded-lg shadow-sm">
              Live Track <ArrowRight size={16} className="ml-1" />
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-bold text-slate-700 mb-2">No Active Token</h3>
            <p className="text-slate-500 mb-4">You haven't joined any queue yet.</p>
            <Link href="/citizen/offices" className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg inline-flex items-center">
              Find an Office <ArrowRight size={16} className="ml-2" />
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Nearby Offices Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-800">Nearby Offices</h2>
            {!userLocation && <Button variant="outline" size="sm" onClick={requestLocation} className="text-xs py-1 h-7">Enable Location</Button>}
          </div>
          <div className="flex items-center space-x-4">
            <PushNotificationManager />
            <Link href="/citizen/offices" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View All
            </Link>
          </div>
        </div>
        
        {offices.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {processedOffices.map((office: any, i: number) => (
              <Link key={i} href={`/citizen/offices/${office._id}`} className="block transition-transform hover:-translate-y-1">
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">{office.name}</h3>
                        <p className="text-slate-500 text-sm flex items-center mt-1">
                          <MapPin size={14} className="mr-1" /> {office.distanceStr}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${office.statusColor}`}>
                        {office.status}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-slate-500 text-sm">No nearby offices found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
