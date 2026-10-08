"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, MapPin, Building2, ArrowLeft, 
  ArrowRight, Clock, Users, X, Sparkles 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { EmptyState } from '@/components/common/EmptyState';

export default function CitizenSearchPage() {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'offices' | 'services'>('all');
  const [offices, setOffices] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const popularSearches = [
    'Licence', 'Certificate', 'Registration', 'Tax', 'Revenue'
  ];

  useEffect(() => {
    if (!query.trim()) {
      setOffices([]);
      setServices([]);
      setSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/citizen/search?q=${encodeURIComponent(query.trim())}`);
        const json = await res.json();
        if (json.success) {
          setOffices(json.data.offices || []);
          setServices(json.data.services || []);
        } else {
          setOffices([]);
          setServices([]);
        }
      } catch (err) {
        console.error('Search error:', err);
        setOffices([]);
        setServices([]);
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const showOffices = filterType === 'all' || filterType === 'offices';
  const showServices = filterType === 'all' || filterType === 'services';
  const totalResults = (showOffices ? offices.length : 0) + (showServices ? services.length : 0);

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Link href="/citizen/home" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Screen 14 • Search
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">Search Offices & Services</h1>
          </div>
        </div>
      </div>

      {/* Main Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" size={20} />
        <Input
          type="text"
          placeholder="Search by office name, department or service..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-12 pr-10 h-13 text-sm rounded-2xl border-slate-200 bg-white shadow-xs focus-visible:ring-blue-600"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Popular Chips */}
      {!query && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
            <Sparkles size={13} className="mr-1 text-amber-500" /> Suggested Keywords
          </p>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((tag) => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-colors shadow-2xs"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {query && (
        <div className="flex space-x-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            All Results ({offices.length + services.length})
          </button>
          <button
            onClick={() => setFilterType('offices')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              filterType === 'offices' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Offices ({offices.length})
          </button>
          <button
            onClick={() => setFilterType('services')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              filterType === 'services' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Services ({services.length})
          </button>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="space-y-4">
          <SkeletonLoader type="office" count={2} />
          <SkeletonLoader type="service" count={3} />
        </div>
      ) : query && searched && totalResults === 0 ? (
        <EmptyState
          icon={<Search size={32} />}
          title="No results found"
          description={`We couldn't find any offices or services matching "${query}". Try another search term.`}
          actionText="Browse All Offices"
          actionHref="/citizen/offices"
        />
      ) : (
        <div className="space-y-6">
          {/* Offices List */}
          {showOffices && offices.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center">
                <Building2 size={14} className="mr-1.5 text-blue-600" />
                Government Offices ({offices.length})
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {offices.map((office) => (
                  <Link key={office._id} href={`/citizen/offices/${office._id}`}>
                    <Card className="hover:border-blue-400 transition-all border-slate-200 shadow-2xs bg-white">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{office.name}</h4>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {office.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center line-clamp-1">
                          <MapPin size={12} className="mr-1 shrink-0 text-slate-400" />
                          {office.address}
                        </p>
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Users size={12} className="text-blue-500" /> {office.waitingCount} waiting
                          </span>
                          <span className="text-blue-600 font-semibold flex items-center">
                            Details <ArrowRight size={11} className="ml-1" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Services List */}
          {showServices && services.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center">
                <Clock size={14} className="mr-1.5 text-indigo-600" />
                Government Services ({services.length})
              </h3>
              <div className="space-y-2">
                {services.map((svc) => (
                  <Link key={svc._id} href={`/citizen/services/${svc._id}`}>
                    <div className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-blue-400 transition-all flex items-center justify-between shadow-2xs">
                      <div className="min-w-0 pr-4">
                        <h4 className="font-bold text-sm text-slate-900 truncate">{svc.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                          {svc.office?.name || 'Government Office'} • Est. {svc.estimatedServiceTime} mins • Fee: ₹{svc.fee}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg shrink-0">
                        Get Token
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
