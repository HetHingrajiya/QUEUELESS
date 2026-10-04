"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const counterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  number: z.coerce.number().min(1, 'Number must be greater than 0'),
  officeId: z.string().min(1, 'Office is required'),
  serviceId: z.string().min(1, 'Service is required'),
});

type CounterFormValues = z.infer<typeof counterSchema>;

export default function AdminAddCounter() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [orgId, setOrgId] = useState<string>('');
  
  const [offices, setOffices] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.organizationId) {
          setOrgId(data.data.organizationId);
          fetch(`/api/offices?organizationId=${data.data.organizationId}`)
            .then(res => res.json())
            .then(officeData => {
              if (officeData.success) setOffices(officeData.data);
            });
        }
      })
      .catch(console.error);
  }, []);

  const fetchServices = async (officeId: string) => {
    try {
      const res = await fetch(`/api/services?officeId=${officeId}`);
      const data = await res.json();
      if (data.success) {
        setServices(data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CounterFormValues>({
    resolver: zodResolver(counterSchema),
  });

  const onSubmit = async (data: CounterFormValues) => {
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/counters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      
      if (result.success) {
        router.push('/admin/counters');
        router.refresh();
      } else {
        setError(result.message || 'Failed to create counter');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12 p-6">
      <div className="flex items-center mb-6">
        <Link href="/admin/counters" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-2xl font-bold text-slate-800">Add New Counter</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Counter Details</CardTitle>
          <CardDescription>Register a new service counter for an office.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(e); }}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Counter Name *</Label>
                <Input id="name" {...register('name')} placeholder="e.g. Counter 1" />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="number">Counter Number *</Label>
                <Input id="number" type="number" {...register('number')} placeholder="e.g. 1" />
                {errors.number && <p className="text-sm text-red-600">{errors.number.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="office">Assign Office *</Label>
              <Select 
                value={watch('officeId') || ""} 
                onValueChange={(val: any) => { 
                  if (val) {
                    setValue('officeId', val as string); 
                    setValue('serviceId', ''); // Reset service when office changes
                    fetchServices(val as string);
                  }
                }} 
                disabled={offices.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select office">
                    {offices.find(office => office._id === watch('officeId'))?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {offices.map(office => (
                    <SelectItem key={office._id} value={office._id}>{office.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.officeId && <p className="text-sm text-red-600">{errors.officeId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="service">Assign Service *</Label>
              <Select 
                value={watch('serviceId') || ""} 
                onValueChange={(val: any) => { if (val) setValue('serviceId', val as string); }} 
                disabled={!watch('officeId') || services.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!watch('officeId') ? "Select an office first" : "Select service"}>
                    {services.find(s => s._id === watch('serviceId'))?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {services.map(s => (
                    <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.serviceId && <p className="text-sm text-red-600">{errors.serviceId.message}</p>}
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-100">
              <Link href="/admin/counters">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading || !orgId}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Create Counter'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
