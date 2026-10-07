"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, MapPin, ArrowRight, Heart } from 'lucide-react';
import Link from 'next/link';

export default function CitizenFavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For Phase 1, favorites are stored in LocalStorage
    const fetchFavorites = async () => {
      try {
        const stored = localStorage.getItem('queueless_favorites');
        if (stored) {
          const parsed = JSON.parse(stored);
          setFavorites(parsed);
        }
      } catch (error) {
        console.error('Failed to load favorites:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFavorites();
  }, []);

  const removeFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    const updated = favorites.filter(f => f._id !== id);
    setFavorites(updated);
    localStorage.setItem('queueless_favorites', JSON.stringify(updated));
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading favorites...</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-extrabold text-slate-800">Saved Offices</h2>
        <p className="text-slate-500">Your frequently visited government offices.</p>
      </div>

      {favorites.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((office) => (
            <Link key={office._id} href={`/citizen/offices/${office._id}`} className="block transition-transform hover:-translate-y-1">
              <Card className="hover:shadow-lg transition-shadow border-slate-200 overflow-hidden relative">
                <button 
                  onClick={(e) => removeFavorite(office._id, e)}
                  className="absolute top-3 right-3 z-10 p-2 bg-white/80 rounded-full text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                >
                  <Heart size={18} fill="currentColor" />
                </button>
                <div className="h-24 bg-slate-100 flex items-center justify-center border-b border-slate-100">
                  <Building2 size={32} className="text-slate-300" />
                </div>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-slate-900 pr-8 line-clamp-1">{office.name}</h3>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-slate-500 text-sm flex items-start">
                      <MapPin size={16} className="mr-2 text-slate-400 shrink-0 mt-0.5" /> 
                      <span className="line-clamp-2">{office.address || 'Address not provided'}</span>
                    </p>
                  </div>
                  
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${office.statusColor || 'bg-emerald-50 text-emerald-700'}`}>
                      {office.status || 'ACTIVE'}
                    </span>
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
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-red-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">No saved offices</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">
            You haven't added any offices to your favorites yet.
          </p>
          <Link href="/citizen/offices">
            <span className="inline-flex items-center justify-center h-10 px-6 font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">
              Browse Offices
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
