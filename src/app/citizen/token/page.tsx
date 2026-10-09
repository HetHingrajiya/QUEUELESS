"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, MapPin, Briefcase, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface OfficeOption {
  _id: string;
  name: string;
}

interface ServiceOption {
  _id: string;
  name: string;
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
        setError(data.message || 'No services available for this office');
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

  return (
    <div className="space-y-6 pb-24 pt-4 max-w-md mx-auto">
      <div className="flex items-center mb-2 px-4">
        <Button variant="ghost" size="sm" className="mr-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-xl font-bold text-slate-900">Book Virtual Token</h2>
      </div>

      <div className="px-4 space-y-4">
        {/* Error Feedback Banner */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-start gap-3 shadow-xs">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
            <div className="space-y-1.5 flex-1">
              <p className="font-semibold leading-relaxed">{error}</p>
              {existingActiveTokenId && (
                <div className="pt-1">
                  <Link href={`/citizen/queue/${existingActiveTokenId}`}>
                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-8">
                      View Active Token <ArrowRight size={13} className="ml-1" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-slate-900">Select Service Details</CardTitle>
            <CardDescription className="text-xs">
              Choose an authorized government office and the service you require.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            
            {/* Office Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center">
                <MapPin size={14} className="mr-1.5 text-blue-600" /> Government Office
              </label>
              {fetchingOffices ? (
                <div className="h-12 w-full bg-slate-100 animate-pulse rounded-xl" />
              ) : (
                <Select value={selectedOffice} onValueChange={(val) => { if (val) handleOfficeChange(val); }}>
                  <SelectTrigger className="h-12 border-slate-200 rounded-xl text-xs font-medium">
                    <SelectValue placeholder="Select an office" />
                  </SelectTrigger>
                  <SelectContent>
                    {offices.map((office: OfficeOption) => (
                      <SelectItem key={office._id} value={office._id} className="text-xs">
                        {office.name}
                      </SelectItem>
                    ))}
                    {offices.length === 0 && <div className="p-3 text-xs text-slate-400 text-center">No active offices found</div>}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Service Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center">
                <Briefcase size={14} className="mr-1.5 text-blue-600" /> Required Service
              </label>
              {fetchingServices ? (
                <div className="h-12 w-full bg-slate-100 animate-pulse rounded-xl flex items-center px-4 text-xs text-slate-400">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" /> Loading services...
                </div>
              ) : (
                <Select 
                  value={selectedService} 
                  onValueChange={(val) => { setSelectedService(val || ''); setError(null); }} 
                  disabled={!selectedOffice || services.length === 0}
                >
                  <SelectTrigger className="h-12 border-slate-200 rounded-xl text-xs font-medium">
                    <SelectValue placeholder={!selectedOffice ? "Select an office first" : (services.length === 0 ? "No services available" : "Select a service")} />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service: ServiceOption) => (
                      <SelectItem key={service._id} value={service._id} className="text-xs">
                        {service.name}
                      </SelectItem>
                    ))}
                    {selectedOffice && services.length === 0 && (
                      <div className="p-3 text-xs text-slate-400 text-center">No active services for this office</div>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <Button 
                onClick={handleGenerateToken} 
                disabled={!selectedOffice || !selectedService || loading}
                className="w-full h-12 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" /> 
                    Allocating Token...
                  </>
                ) : (
                  'Confirm & Get Token'
                )}
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
