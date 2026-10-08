"use client";

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Heart, MapPin, Clock, Users, 
  Building2, ArrowRight, Zap, CheckCircle2, ShieldCheck 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function FavoriteOfficeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(true);

  const office = {
    id: id || "fav-1",
    name: "Regional Transport Office (RTO Rajkot)",
    address: "Civil Center, Ring Road, Sector 12",
    distance: "2.4 km away",
    status: "OPEN (LIGHT QUEUE)",
    totalCounters: 8,
    activeQueueLength: 14,
    avgWaitTime: "12 mins",
    popularServices: [
      { id: "s1", name: "Driving Licence Renewal", wait: "10 mins" },
      { id: "s2", name: "Learner Licence Test", wait: "18 mins" },
      { id: "s3", name: "Vehicle Registration", wait: "15 mins" }
    ]
  };

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
          onClick={() => setIsFavorite(!isFavorite)}
          className={`p-2 rounded-full border transition-colors ${
            isFavorite ? 'bg-red-50 border-red-200 text-red-500' : 'bg-slate-100 border-slate-200 text-slate-400'
          }`}
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
                <Users size={13} className="mr-1 text-blue-500" /> Current Queue
              </span>
              <p className="text-lg font-black text-slate-900 mt-1">{office.activeQueueLength} Waiting</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 flex items-center">
                <Clock size={13} className="mr-1 text-emerald-500" /> Avg Wait
              </span>
              <p className="text-lg font-black text-emerald-600 mt-1">~{office.avgWaitTime}</p>
            </div>
          </div>

          {/* Quick Book Services */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center">
              <Zap size={14} className="text-amber-500 mr-1.5" />
              1-Click Instant Virtual Token
            </h4>
            <div className="space-y-2">
              {office.popularServices.map((srv) => (
                <Link key={srv.id} href={`/citizen/services/${srv.id}`}>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-400 flex items-center justify-between transition-colors group">
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600">{srv.name}</p>
                      <p className="text-[11px] text-slate-400">Est. wait: {srv.wait}</p>
                    </div>
                    <Button size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700">
                      Book
                    </Button>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Link href={`/citizen/offices/${id || 'default'}`} className="block">
          <Button variant="outline" className="w-full text-xs font-semibold border-slate-300">
            Full Office Profile
          </Button>
        </Link>
        <Link href="/citizen/favorites" className="block">
          <Button variant="outline" className="w-full text-xs font-semibold border-slate-300">
            View All Saved
          </Button>
        </Link>
      </div>
    </div>
  );
}
