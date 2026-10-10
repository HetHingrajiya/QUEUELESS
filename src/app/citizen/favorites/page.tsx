"use client";

import { useState, useEffect } from 'react';
import { Building2, MapPin, ArrowRight, Heart, Users, Clock } from 'lucide-react';
import Link from 'next/link';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { CitizenFavorite, CitizenOffice, ApiResponse } from '@/types/citizen';

export default function CitizenFavoritesPage() {
  const [favorites, setFavorites] = useState<CitizenFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/citizen/favorites');
      if (!res.ok) throw new Error(`Unable to load favorites (${res.status})`);
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
  }, [retryCount]);

  const removeFavorite = async (officeId: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/citizen/favorites?officeId=${officeId}`, { method: 'DELETE' });
      setFavorites(prev => prev.filter(f => (f.office?._id || f.officeId) !== officeId && f._id !== officeId));
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      
      {/* Header section */}
      <div className="flex flex-col space-y-2 mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Favorite Hubs</h1>
        <p className="text-muted-foreground text-xs sm:text-sm font-semibold">Your pinned offices with live queue statistics and quick access.</p>
      </div>

      {loading ? (
        <LoadingState label="Loading saved offices..." />
      ) : error ? (
        <ErrorState description={error} onRetry={() => setRetryCount((count) => count + 1)} />
      ) : favorites.length === 0 ? (
        <div className="bg-background shadow-neu rounded-[2.5rem] p-8 border-0 mt-8">
          <EmptyState
            icon={<Heart size={48} className="text-red-500/50" />}
            title="No Favorite Offices"
            description="You haven't bookmarked any offices yet. Pin offices from the Explore tab for instant access."
            actionText="Browse Offices"
            actionHref="/citizen/offices"
          />
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((fav) => {
            const office: CitizenOffice = fav.office || fav.officeId;
            const officeId = office._id || fav._id;
            
            return (
              <Link 
                key={fav._id} 
                href={`/citizen/favorites/${officeId}`} 
                className="block group"
              >
                <div className="bg-background shadow-neu group-hover:shadow-neu-hover rounded-[2rem] p-6 transition-all relative border-0 flex flex-col h-full">
                  
                  {/* Floating Action Button for Unfavorite */}
                  <button 
                    onClick={(e) => removeFavorite(officeId, e)}
                    className="absolute top-6 right-6 w-10 h-10 bg-background shadow-neu hover:shadow-neu-inset rounded-full flex items-center justify-center text-red-500 transition-all z-10"
                    title="Remove from favorites"
                  >
                    <Heart size={16} className="fill-red-500" />
                  </button>
                  
                  {/* Card Header */}
                  <div className="flex items-center gap-4 mb-5 pr-12">
                    <div className="w-14 h-14 rounded-2xl bg-background shadow-neu-inset flex items-center justify-center text-primary shrink-0">
                      <Building2 size={24} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-lg text-foreground truncate">{office.name}</h3>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest truncate mt-1">
                        {office.department || 'Office'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Address */}
                  <div className="flex items-start mb-6">
                    <MapPin size={16} className="mr-2 text-primary shrink-0 mt-0.5" /> 
                    <p className="text-sm font-semibold text-muted-foreground line-clamp-2 leading-relaxed">
                      {office.address || 'Address registered'}
                    </p>
                  </div>

                  <div className="mt-auto">
                    {/* Live Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-background shadow-neu-inset p-4 rounded-2xl text-center">
                        <Users size={16} className="text-primary mx-auto mb-2" />
                        <p className="font-black text-xl text-foreground leading-none mb-1">{fav.waitingCount ?? 0}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">In Queue</p>
                      </div>
                      <div className="bg-background shadow-neu-inset p-4 rounded-2xl text-center">
                        <Clock size={16} className="text-amber-500 mx-auto mb-2" />
                        <p className="font-black text-xl text-foreground leading-none mb-1">{fav.estimatedWaitMinutes ?? 0}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Min Wait</p>
                      </div>
                    </div>
                    
                    {/* Footer Actions */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black px-4 py-2 rounded-xl bg-background shadow-neu text-emerald-500 uppercase tracking-widest">
                        OPEN
                      </span>
                      <span className="text-xs font-bold text-primary uppercase tracking-widest flex items-center group-hover:translate-x-1 transition-transform">
                        View Details <ArrowRight size={14} className="ml-2" />
                      </span>
                    </div>
                  </div>

                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
