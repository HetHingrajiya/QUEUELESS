"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, MapPin, Building2, Briefcase, ArrowLeft, 
  ArrowRight, Clock, Users, X, Sparkles, Filter 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function CitizenSearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'offices' | 'services'>('all');
  const [offices, setOffices] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const popularSearches = [
    'Driving Licence', 'Aadhaar Card', 'Passport Verification', 
    'Birth Certificate', 'Property Tax', 'RTO Rajkot'
  ];

  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      try {
        const [officesRes, servicesRes] = await Promise.all([
          fetch(`/api/citizen/offices?search=${encodeURIComponent(query)}`).then(r => r.json()).catch(() => ({ success: false })),
          fetch('/api/services').then(r => r.json()).catch(() => ({ success: false }))
        ]);

        if (officesRes.success) {
          setOffices(officesRes.data || []);
        } else {
          setOffices([
            { _id: 'o1', name: 'Regional Transport Office (RTO)', address: 'Sector 12, Civil Center', distanceStr: '2.4 km', status: 'OPEN', statusColor: 'bg-emerald-50 text-emerald-700' },
            { _id: 'o2', name: 'Municipal Corporation HQ', address: 'Dhebar Road, Center', distanceStr: '3.8 km', status: 'OPEN', statusColor: 'bg-emerald-50 text-emerald-700' },
            { _id: 'o3', name: 'Collector Office & Revenue Center', address: 'Jail Road', distanceStr: '5.1 km', status: 'BUSY', statusColor: 'bg-amber-50 text-amber-700' }
          ]);
        }

        if (servicesRes.success) {
          setServices(servicesRes.data || []);
        } else {
          setServices([
            { _id: 's1', name: 'Driving Licence Renewal', officeName: 'RTO Rajkot', waitingCount: 8, estimatedTime: 22 },
            { _id: 's2', name: 'Birth & Death Registration', officeName: 'Municipal Corp', waitingCount: 3, estimatedTime: 12 },
            { _id: 's3', name: 'Commercial Vehicle Fitness', officeName: 'RTO Rajkot', waitingCount: 15, estimatedTime: 40 },
            { _id: 's4', name: 'Land Record & Property Card', officeName: 'Collector Office', waitingCount: 5, estimatedTime: 18 }
          ]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      performSearch();
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const filteredOffices = offices.filter(o => 
    !query || o.name.toLowerCase().includes(query.toLowerCase()) || (o.address && o.address.toLowerCase().includes(query.toLowerCase()))
  );

  const filteredServices = services.filter(s =>
    !query || s.name.toLowerCase().includes(query.toLowerCase()) || (s.officeName && s.officeName.toLowerCase().includes(query.toLowerCase()))
  );

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
              Screen 14 • Explore
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
          className="pl-12 pr-10 h-14 bg-white rounded-2xl border-slate-200 text-base shadow-sm focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Popular Search Tags */}
      {!query && (
        <div className="space-y-2">
          <div className="flex items-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Sparkles size={14} className="mr-1.5 text-amber-500" />
            Popular Searches
          </div>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((term) => (
              <button
                key={term}
                onClick={() => setQuery(term)}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 text-slate-700 text-xs rounded-lg transition-colors font-medium shadow-2xs"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Type Filter Buttons */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filterType === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Results
        </button>
        <button
          onClick={() => setFilterType('offices')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center ${
            filterType === 'offices'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Building2 size={14} className="mr-1.5" /> Offices ({filteredOffices.length})
        </button>
        <button
          onClick={() => setFilterType('services')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center ${
            filterType === 'services'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Briefcase size={14} className="mr-1.5" /> Services ({filteredServices.length})
        </button>
      </div>

      {/* Results Section */}
      <div className="space-y-6">
        {/* Offices Matching */}
        {(filterType === 'all' || filterType === 'offices') && filteredOffices.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center uppercase tracking-wide">
              <Building2 size={16} className="mr-2 text-blue-600" />
              Offices Matching ({filteredOffices.length})
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredOffices.map((office) => (
                <Link key={office._id} href={`/citizen/offices/${office._id}`}>
                  <Card className="hover:border-blue-300 hover:shadow-md transition-all h-full">
                    <CardContent className="p-4 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-slate-900 text-sm">{office.name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${office.statusColor || 'bg-emerald-50 text-emerald-700'}`}>
                            {office.status || 'OPEN'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center mt-1">
                          <MapPin size={13} className="mr-1 text-slate-400 shrink-0" />
                          <span className="line-clamp-1">{office.address}</span>
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">{office.distanceStr || 'Nearby'}</span>
                        <span className="text-blue-600 font-bold flex items-center">
                          View <ArrowRight size={13} className="ml-1" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Services Matching */}
        {(filterType === 'all' || filterType === 'services') && filteredServices.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center uppercase tracking-wide">
              <Briefcase size={16} className="mr-2 text-indigo-600" />
              Services Matching ({filteredServices.length})
            </h3>
            <div className="space-y-2">
              {filteredServices.map((service) => (
                <Link key={service._id} href={`/citizen/services/${service._id}`}>
                  <Card className="hover:border-indigo-300 hover:shadow-sm transition-all">
                    <CardContent className="p-3.5 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <Briefcase size={18} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{service.name}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{service.officeName || 'Government Center'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded mb-1 inline-flex items-center">
                          <Clock size={12} className="mr-1" /> ~{service.estimatedTime || 15}m
                        </div>
                        <p className="text-[11px] text-slate-400">{service.waitingCount || 0} waiting</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty Search Result */}
        {filteredOffices.length === 0 && filteredServices.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <Search size={40} className="mx-auto text-slate-300 mb-3" />
            <h3 className="font-bold text-slate-800">No Matching Results</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              We couldn't find any offices or services matching "{query}". Try checking for spelling errors or search for broader keywords.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
