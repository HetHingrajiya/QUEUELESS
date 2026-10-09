"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, MapPin, ArrowRight, Heart, Users, Clock } from 'lucide-react';
import Link from 'next/link';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { EmptyState } from '@/components/common/EmptyState';
import { CitizenFavorite, CitizenOffice, ApiResponse } from '@/types/citizen';

export default function CitizenFavoritesPage() {
  const [favorites, setFavorites] = useState<CitizenFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/citizen/favorites');
      const json: ApiResponse<CitizenFavorite[]> = await res.json();
      if (json.success) {
        setFavorites(json.data || []);
      } else {
        setError(json.message || 'Failed to fetch favorites');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFavorites();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const removeFavorite = async (officeId: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/citizen/favorites?officeId=${officeId}`, { method: 'DELETE' });
      setFavorites(prev => prev.filter(f => f.office?._id !== officeId && f._id !== officeId));
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto pt-2">
      <div className="flex flex-col space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit">
          Screen 38 • Bookmarks
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900">Favorite Government Offices</h1>
        <p className="text-slate-500 text-sm">Your pinned offices with live queue statistics and quick token booking.</p>
      </div>

      {loading ? (
        <SkeletonLoader type="office" count={4} />
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={<Heart size={32} className="text-red-400" />}
          title="No Favorite Offices"
          description="You haven't bookmarked any offices yet. Pin offices from the Explore tab for instant access."
          actionText="Browse Offices"
          actionHref="/citizen/offices"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {favorites.map((fav) => {
            const office: CitizenOffice = fav.office || fav.officeId;
            return (
              <Link 
                key={fav._id} 
                href={`/citizen/favorites/${office._id || fav._id}`} 
                className="block transition-all hover:-translate-y-0.5"
              >
                <Card className="hover:shadow-md transition-shadow border-slate-200 overflow-hidden relative bg-white">
                  <button 
                    onClick={(e) => removeFavorite(office._id || fav._id, e)}
                    className="absolute top-3 right-3 z-10 p-2 bg-white/90 rounded-full text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                    title="Remove from favorites"
                  >
                    <Heart size={18} fill="currentColor" />
                  </button>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <Building2 size={20} />
                      </div>
                      <div className="min-w-0 pr-8">
                        <h3 className="font-bold text-base text-slate-900 truncate">{office.name}</h3>
                        <p className="text-xs text-slate-400 truncate">{office.department || 'Office'}</p>
                      </div>
                    </div>
                    
                    <p className="text-slate-500 text-xs flex items-start mb-4 line-clamp-1">
                      <MapPin size={14} className="mr-1.5 text-slate-400 shrink-0 mt-0.5" /> 
                      <span>{office.address || 'Address registered'}</span>
                    </p>

                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs mb-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Users size={14} className="text-blue-500" />
                        <span><strong>{fav.waitingCount ?? 0}</strong> in queue</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Clock size={14} className="text-amber-500" />
                        <span>~{fav.estimatedWaitMinutes ?? 0} min wait</span>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        OPEN
                      </span>
                      <span className="text-xs font-semibold text-blue-600 flex items-center">
                        View Details <ArrowRight size={14} className="ml-1" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
