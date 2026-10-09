"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Loader2, MapPin, Briefcase, AlertCircle, 
  ArrowRight, Ticket, CheckCircle2, Clock, Users, Building2, ShieldCheck, Sparkles 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface OfficeOption {
  _id: string;
  name: string;
  address?: string;
  phone?: string;
}

interface ServiceOption {
  _id: string;
  name: string;
  description?: string;
  averageServiceTime?: number;
  waitingCount?: number;
  activeCounters?: number;
}

export default function CitizenTokenGeneration() {
  const router = useRouter();
  const [offices, setOffices] = useState<OfficeOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  
  const [selectedOffice, setSelectedOffice] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [fetchingOffices, setFetchingOffices] = useState(true);
  const [fetchingServices, setFetchingServices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingActiveTokenId, setExistingActiveTokenId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/citizen/offices')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setOffices(data.data);
        } else {
          setError(data.message || 'Unable to load government offices');
        }
      })
      .catch(() => {
        setError('Network error: Unable to connect to server. Please check your connection.');
      })
      .finally(() => setFetchingOffices(false));
  }, []);

  const handleOfficeChange = async (officeId: string) => {
    setSelectedOffice(officeId);
    setSelectedService('');
    setError(null);
    setExistingActiveTokenId(null);
    setFetchingServices(true);
    
    try {
      const res = await fetch(`/api/citizen/services?officeId=${officeId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setServices(data.data);
      } else {
        setServices([]);
        setError(data.message || 'No active services available for this office');
      }
    } catch {
      setError('Failed to load services for the selected office.');
    } finally {
      setFetchingServices(false);
    }
  };

  const handleGenerateToken = async () => {
    if (!selectedOffice || !selectedService || loading) return;
    
    setLoading(true);
    setError(null);
    setExistingActiveTokenId(null);

    try {
      const res = await fetch('/api/citizen/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officeId: selectedOffice,
          serviceId: selectedService
        })
      });
      
      const json = await res.json();
      if (json.success && json.data?.tokenId) {
        router.push(`/citizen/token/confirmation?tokenId=${json.data.tokenId}`);
      } else {
        setError(json.message || 'Failed to generate token');
        if (json.errorCode === 'ACTIVE_TOKEN_EXISTS' && json.data?.activeTokenId) {
          setExistingActiveTokenId(json.data.activeTokenId);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error occurred during token booking');
    } finally {
      setLoading(false);
    }
  };

  const activeOfficeObj = offices.find(o => String(o._id) === String(selectedOffice));
  const activeServiceObj = services.find(s => String(s._id) === String(selectedService));

  const officeItems = React.useMemo(() => 
    offices.map((o: OfficeOption) => ({ value: o._id, label: o.name })),
    [offices]
  );

  const serviceItems = React.useMemo(() => 
    services.map((s: ServiceOption) => ({ value: s._id, label: s.name })),
    [services]
  );

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-6 px-4 space-y-6 font-sans">
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link 
            href="/citizen/home" 
            className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Book Virtual Token</h1>
            <p className="text-xs text-slate-500">Official digital queuing pass for government office counters.</p>
          </div>
        </div>

        <Badge variant="outline" className="hidden sm:inline-flex bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-semibold py-1 px-2.5">
          <ShieldCheck size={12} className="mr-1 text-blue-600" /> Authorized Portal
        </Badge>
      </div>

      {/* Step Guide Strip */}
      <div className="grid grid-cols-3 gap-2 py-1">
        <div className={`p-2.5 rounded-xl border text-center transition-all ${
          selectedOffice ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'
        }`}>
          <p className="text-[10px] font-bold uppercase tracking-wider">Step 1</p>
          <p className="text-xs font-semibold truncate mt-0.5">Select Office</p>
        </div>
        <div className={`p-2.5 rounded-xl border text-center transition-all ${
          selectedService ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'
        }`}>
          <p className="text-[10px] font-bold uppercase tracking-wider">Step 2</p>
          <p className="text-xs font-semibold truncate mt-0.5">Choose Service</p>
        </div>
        <div className={`p-2.5 rounded-xl border text-center transition-all ${
          selectedOffice && selectedService ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-400'
        }`}>
          <p className="text-[10px] font-bold uppercase tracking-wider">Step 3</p>
          <p className="text-xs font-semibold truncate mt-0.5">Get Pass</p>
        </div>
      </div>

      {/* Error / Alert Display */}
      {error && (
        <div className="p-4 bg-red-50/90 border border-red-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-red-800 animate-in fade-in-50 duration-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-bold">{error}</p>
              {existingActiveTokenId && (
                <p className="text-[11px] text-red-700">You already have an active pass in this queue.</p>
              )}
            </div>
          </div>
          {existingActiveTokenId && (
            <Link href={`/citizen/queue/${existingActiveTokenId}`}>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs whitespace-nowrap h-8">
                Go to Active Token <ArrowRight size={13} className="ml-1" />
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Main Booking Card */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden rounded-2xl">
        <CardHeader className="bg-slate-50/60 border-b border-slate-100 p-5">
          <CardTitle className="text-base font-bold text-slate-900">Service Selection</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Pick the government branch and required administrative service to book your queue ticket.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-6">
          {/* Office Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin size={15} className="text-blue-600" /> Government Office
              </span>
              <span className="text-[10px] font-semibold text-slate-400">Required</span>
            </label>

            {fetchingOffices ? (
              <div className="h-12 w-full bg-slate-100 animate-pulse rounded-xl flex items-center px-4 text-xs text-slate-400">
                <Loader2 className="animate-spin h-4 w-4 mr-2 text-blue-600" /> Loading official branches...
              </div>
            ) : (
              <Select 
                value={selectedOffice} 
                items={officeItems}
                onValueChange={(val) => { if (val) handleOfficeChange(val); }}
              >
                <SelectTrigger className="h-12 border-slate-200 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Select an office branch">
                    {activeOfficeObj?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {offices.map((office: OfficeOption) => (
                    <SelectItem key={office._id} value={office._id} label={office.name} className="text-xs py-2.5">
                      <div className="flex flex-col text-left">
                        <span className="font-semibold text-slate-900">{office.name}</span>
                        {office.address && <span className="text-[11px] text-slate-400">{office.address}</span>}
                      </div>
                    </SelectItem>
                  ))}
                  {offices.length === 0 && (
                    <div className="p-3 text-xs text-slate-400 text-center">No active offices available</div>
                  )}
                </SelectContent>
              </Select>
            )}

            {/* Office Summary Preview */}
            {activeOfficeObj && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-600 animate-in fade-in-50 duration-200">
                <div className="flex items-center gap-2 truncate">
                  <Building2 size={14} className="text-slate-400 shrink-0" />
                  <span className="truncate">{activeOfficeObj.address || 'Government Administrative Complex'}</span>
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] shrink-0 font-semibold">
                  Open
                </Badge>
              </div>
            )}
          </div>

          {/* Service Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Briefcase size={15} className="text-blue-600" /> Required Service
              </span>
              <span className="text-[10px] font-semibold text-slate-400">Required</span>
            </label>

            {fetchingServices ? (
              <div className="h-12 w-full bg-slate-100 animate-pulse rounded-xl flex items-center px-4 text-xs text-slate-400">
                <Loader2 className="animate-spin h-4 w-4 mr-2 text-blue-600" /> Loading available services...
              </div>
            ) : (
              <Select 
                value={selectedService} 
                items={serviceItems}
                onValueChange={(val) => { setSelectedService(val || ''); setError(null); }} 
                disabled={!selectedOffice || services.length === 0}
              >
                <SelectTrigger className="h-12 border-slate-200 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50">
                  <SelectValue placeholder={!selectedOffice ? "Select an office first" : (services.length === 0 ? "No services available" : "Select a service")}>
                    {activeServiceObj?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {services.map((service: ServiceOption) => (
                    <SelectItem key={service._id} value={service._id} label={service.name} className="text-xs py-2.5">
                      <div className="flex flex-col text-left">
                        <span className="font-semibold text-slate-900">{service.name}</span>
                        {service.description && (
                          <span className="text-[11px] text-slate-400 line-clamp-1">{service.description}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                  {selectedOffice && services.length === 0 && (
                    <div className="p-3 text-xs text-slate-400 text-center">No active services registered for this office</div>
                  )}
                </SelectContent>
              </Select>
            )}

            {/* Service Live Metrics Preview */}
            {activeServiceObj && (
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 grid grid-cols-2 gap-2 text-xs animate-in fade-in-50 duration-200">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-blue-600 shrink-0" />
                  <span className="text-slate-600">
                    Est. Duration: <strong className="text-slate-900">~{activeServiceObj.averageServiceTime || 10} min</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-blue-600 shrink-0" />
                  <span className="text-slate-600">
                    In Queue: <strong className="text-slate-900">{activeServiceObj.waitingCount ?? 0} waiting</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Ticket Booking Confirmation Button */}
          <div className="pt-2">
            <Button 
              onClick={handleGenerateToken} 
              disabled={!selectedOffice || !selectedService || loading}
              className="w-full h-12 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" /> 
                  Generating Virtual Token...
                </>
              ) : (
                <>
                  Confirm & Get Token
                  <ArrowRight size={16} className="ml-1.5" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trust & Policy Info */}
      <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200 text-center text-[11px] text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700 flex items-center justify-center gap-1.5">
          <Ticket size={13} className="text-blue-600" /> Digital Token Rules
        </p>
        <p>One active token is permitted per service. Please present your digital pass QR upon arrival at the office.</p>
      </div>
    </div>
  );
}
