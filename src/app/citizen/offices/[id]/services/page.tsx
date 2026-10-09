"use client";

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Search, Clock, Users, Briefcase, 
  ChevronRight, Building2, ShieldCheck, Loader2, Sparkles, AlertCircle 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CitizenOffice, CitizenService, ApiResponse } from '@/types/citizen';

export default function OfficeServicesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [office, setOffice] = useState<CitizenOffice | null>(null);
  const [services, setServices] = useState<CitizenService[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    const fetchServicesData = async () => {
      try {
        const res = await fetch(`/api/citizen/offices/${id}`);
        const json: ApiResponse<{ office: CitizenOffice; services: CitizenService[] }> = await res.json();
        if (json.success && json.data) {
          setOffice(json.data.office);
          setServices(json.data.services || []);
        } else {
          setOffice(null);
          setServices([]);
        }
      } catch (err: unknown) {
        console.error(err);
        setOffice(null);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServicesData();
  }, [id]);

  const categories = ['ALL', 'LICENCE', 'VEHICLE', 'TEST', 'GENERAL'];

  const filteredServices = services.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || (s.category && s.category.toUpperCase() === selectedCategory);
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto pt-2">
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Screen 12 • Explore
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">Office Services</h1>
          </div>
        </div>
      </div>

      {/* Office Banner */}
      <Card className="border-blue-100 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md overflow-hidden">
        <CardContent className="p-5 flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 text-blue-200 text-xs mb-1">
              <Building2 size={14} />
              <span>{office?.code || 'OFFICE'}</span>
            </div>
            <h2 className="text-xl font-bold">{office?.name || 'Office Details'}</h2>
            <p className="text-xs text-blue-100 mt-1 line-clamp-1">{office?.address || 'Address unavailable'}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 text-center">
            <span className="text-xs text-blue-100 block">Total Services</span>
            <span className="text-lg font-bold">{services.length}</span>
          </div>
        </CardContent>
      </Card>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <Input
          placeholder="Search services (e.g., Licence, Registration)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-12 bg-white rounded-xl border-slate-200 text-sm shadow-sm"
        />
      </div>

      {/* Category Pills */}
      <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Services List */}
      <div className="space-y-3">
        {filteredServices.length > 0 ? (
          filteredServices.map((service) => (
            <Link
              key={service._id}
              href={`/citizen/services/${service._id}`}
              className="block group"
            >
              <Card className="border-slate-200 hover:border-blue-300 hover:shadow-md transition-all">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {service.name}
                      </h3>
                      <div className="flex items-center space-x-4 text-xs text-slate-500 mt-1">
                        <span className="flex items-center text-slate-600 font-medium">
                          <Users size={13} className="mr-1 text-slate-400" />
                          {service.waitingCount || 0} in queue
                        </span>
                        <span className="flex items-center text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold">
                          <Clock size={12} className="mr-1 text-amber-600" />
                          ~{service.estimatedTime || 15} min
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="hidden sm:inline text-xs font-semibold text-blue-600 group-hover:underline">
                      Get Token
                    </span>
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 text-slate-400 transition-colors">
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
            <AlertCircle className="mx-auto h-10 w-10 text-slate-300 mb-2" />
            <h3 className="font-bold text-slate-700">No Services Found</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              Try searching with a different keyword or select another category filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
