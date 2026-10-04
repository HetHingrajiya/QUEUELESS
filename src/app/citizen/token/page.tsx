"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, MapPin, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CitizenTokenGeneration() {
  const router = useRouter();
  const [offices, setOffices] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  
  const [selectedOffice, setSelectedOffice] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch('/api/offices')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setOffices(data.data);
        }
      })
      .finally(() => setFetching(false));
  }, []);

  const handleOfficeChange = async (officeId: string) => {
    setSelectedOffice(officeId);
    setSelectedService('');
    
    try {
      const res = await fetch(`/api/services?officeId=${officeId}`);
      const data = await res.json();
      if (data.success) {
        setServices(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateToken = async () => {
    if (!selectedOffice || !selectedService) return;
    
    setLoading(true);
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
      if (json.success) {
        // Navigate to confirmation page or live queue
        router.push(`/citizen/queue/${json.data.tokenId}`);
      } else {
        alert(json.message || 'Failed to generate token');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 pt-6 max-w-md mx-auto">
      <div className="flex items-center mb-6 px-4">
        <Button variant="ghost" size="sm" className="mr-2 -ml-2 text-slate-500" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-2xl font-bold text-slate-800">Generate Virtual Token</h2>
      </div>

      <div className="px-4">
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Select Requirements</CardTitle>
            <CardDescription>Choose an office and the service you need.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                <MapPin size={16} className="mr-2 text-blue-500" /> Government Office
              </label>
              <Select value={selectedOffice} onValueChange={handleOfficeChange}>
                <SelectTrigger className="h-12 border-slate-200">
                  <SelectValue placeholder="Select an office" />
                </SelectTrigger>
                <SelectContent>
                  {offices.map((office: any) => (
                    <SelectItem key={office._id} value={office._id}>
                      {office.name}
                    </SelectItem>
                  ))}
                  {offices.length === 0 && <div className="p-2 text-sm text-slate-500">No offices found</div>}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                <Briefcase size={16} className="mr-2 text-blue-500" /> Required Service
              </label>
              <Select value={selectedService} onValueChange={setSelectedService} disabled={!selectedOffice}>
                <SelectTrigger className="h-12 border-slate-200">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service: any) => (
                    <SelectItem key={service._id} value={service._id}>
                      {service.name}
                    </SelectItem>
                  ))}
                  {selectedOffice && services.length === 0 && <div className="p-2 text-sm text-slate-500">No services found for this office</div>}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4">
              <Button 
                onClick={handleGenerateToken} 
                disabled={!selectedOffice || !selectedService || loading}
                className="w-full h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? <><Loader2 className="animate-spin h-5 w-5 mr-2" /> Generating...</> : 'CONFIRM & GET TOKEN'}
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
