"use client";

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Heart, MapPin, Clock, Users, 
  ArrowRight, Zap 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { CitizenOffice, CitizenService, ApiResponse } from '@/types/citizen';

export default function FavoriteOfficeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [office, setOffice] = useState<CitizenOffice | null>(null);
  const [isFavorite, setIsFavorite] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffice = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/citizen/offices/${id}`);
        const json: ApiResponse<{ office: CitizenOffice; services: CitizenService[] }> = await res.json();
        if (json.success && json.data) {
          setOffice(json.data.office);
          try {
            const favRes = await fetch(`/api/citizen/favorites?officeId=${id}`);
            const favJson: ApiResponse<{ isFavorite: boolean }> = await favRes.json();
            if (favJson.success && favJson.data) {
              setIsFavorite(!!favJson.data.isFavorite);
            }
          } catch {
            // Keep default
          }
        } else {
          setError(json.message || 'Office not found');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch office');
      } finally {
        setLoading(false);
      }
    };

    fetchOffice();
  }, [id]);

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await fetch(`/api/citizen/favorites?officeId=${id}`, { method: 'DELETE' });
        setIsFavorite(false);
      } else {
        await fetch('/api/citizen/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ officeId: id })
        });
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto pt-4">
        <SkeletonLoader type="office" count={1} />
      </div>
    );
  }

  if (error || !office) {
    return (
      <div className="max-w-md mx-auto pt-6 text-center">
        <p className="text-red-600 font-medium">{error || 'Office not found'}</p>
        <Link href="/citizen/favorites" className="text-blue-600 font-semibold text-sm mt-3 inline-block">
          Return to Favorites
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <button 
            onClick={() => router.back()} 
            className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded">
              Screen 39 • Favorites
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">Favorite Office Hub</h1>
          </div>
        </div>

        <button
          onClick={toggleFavorite}
          className={`p-2 rounded-full border transition-colors ${
            isFavorite ? 'bg-red-50 border-red-200 text-red-500' : 'bg-slate-100 border-slate-200 text-slate-400'
          }`}
          title={isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
        >
          <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Office Quick Card */}
      <Card className="border-red-100 bg-gradient-to-br from-white to-red-50/20 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-rose-600 p-5 text-white">
          <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
            SAVED FAVORITE LOCATION
          </span>
          <h2 className="text-xl font-bold mt-2">{office.name}</h2>
          <p className="text-xs text-red-100 flex items-center mt-1">
            <MapPin size={13} className="mr-1 shrink-0" /> {office.address}
          </p>
        </div>

        <CardContent className="p-5 space-y-4">
          {/* Live Snapshot */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 flex items-center">
                <Users size={13} className="mr-1 text-blue-500" /> Department
              </span>
              <p className="text-sm font-black text-slate-900 mt-1 truncate">{office.department || 'General'}</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 flex items-center">
                <Clock size={13} className="mr-1 text-emerald-500" /> Working Hours
              </span>
              <p className="text-xs font-bold text-emerald-600 mt-1 truncate">{office.operatingHours || '09:00 - 17:00'}</p>
            </div>
          </div>

          {/* Quick Book Services */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center">
              <Zap size={14} className="text-amber-500 mr-1.5" />
              Available Services
            </h4>
            <div className="space-y-2">
              {office.services && office.services.length > 0 ? (
                office.services.map((srv: CitizenService) => (
                  <Link key={srv._id} href={`/citizen/services/${srv._id}`}>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:border-red-300 transition-all text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{srv.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Est. {srv.estimatedServiceTime || 15} mins • Fee: ₹{srv.fee || 0}</p>
                      </div>
                      <span className="text-[11px] font-semibold text-blue-600 flex items-center">
                        Get Token <ArrowRight size={12} className="ml-1" />
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No services registered for this office.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-2">
        <Link href={`/citizen/offices/${office._id}`} className="block w-full">
          <Button className="w-full h-11 bg-slate-900 hover:bg-slate-800 font-bold text-xs">
            View Full Office Profile
          </Button>
        </Link>
        <Link href="/citizen/favorites" className="block w-full">
          <Button variant="ghost" className="w-full text-xs text-slate-500">
            Back to Saved Offices
          </Button>
        </Link>
      </div>
    </div>
  );
}
