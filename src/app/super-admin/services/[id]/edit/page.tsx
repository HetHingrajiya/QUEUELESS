"use client";
import { useState, useEffect, use } from 'react';
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

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  organizationId: z.string().min(1, 'Organization is required'),
  officeId: z.string().min(1, 'Office is required'),
  averageServiceTime: z.coerce.number().min(1, 'Time is required'),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export default function EditService({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const id = unwrappedParams.id;
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
  });

  const fetchOffices = async (orgId: string) => {
    try {
      const res = await fetch(`/api/offices?organizationId=${orgId}`);
      const data = await res.json();
      if (data.success) setOffices(data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        const orgRes = await fetch('/api/organizations');
        const orgData = await orgRes.json();
        if (orgData.success) {
          setOrganizations(orgData.data);
        }

        const svcRes = await fetch(`/api/services/${id}`);
        const svcData = await svcRes.json();
        
        if (svcData.success) {
          const svc = svcData.data;
          await fetchOffices(svc.organizationId);
          reset({
            name: svc.name,
            code: svc.code,
            organizationId: svc.organizationId,
            officeId: svc.officeId,
            averageServiceTime: svc.averageServiceTime,
          });
        } else {
          setError('Failed to fetch service data');
        }
      } catch (err) {
        console.error(err);
        setError('Error loading data');
      } finally {
        setIsFetching(false);
      }
    };
    initializeData();
  }, [id, reset]);

  const onSubmit = async (data: ServiceFormValues) => {
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      
      if (result.success) {
        window.location.href = '/super-admin/services';
      } else {
        setError(result.message || 'Failed to update service');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12 p-6">
      <div className="flex items-center mb-6">
        <Link href="/super-admin/services" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-2xl font-bold text-slate-800">Edit Service</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Details</CardTitle>
          <CardDescription>Update service information.</CardDescription>
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
                <Label htmlFor="name">Service Name *</Label>
                <Input id="name" {...register('name')} placeholder="e.g. Birth Certificate" />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Service Code *</Label>
                <Input id="code" {...register('code')} placeholder="e.g. BC-01" />
                {errors.code && <p className="text-sm text-red-600">{errors.code.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="organization">Assign Organization *</Label>
                <Select value={watch('organizationId') || ""} onValueChange={(val: any) => { 
                  if (val) {
                    setValue('organizationId', val as string); 
                    fetchOffices(val as string);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization">
                      {organizations.find(org => org._id === watch('organizationId'))?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map(org => (
                      <SelectItem key={org._id} value={org._id}>{org.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.organizationId && <p className="text-sm text-red-600">{errors.organizationId.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="office">Assign Office *</Label>
                <Select value={watch('officeId') || ""} onValueChange={(val: any) => { if (val) setValue('officeId', val as string); }} disabled={offices.length === 0}>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="averageServiceTime">Average Service Time (minutes) *</Label>
              <Input id="averageServiceTime" type="number" {...register('averageServiceTime')} placeholder="e.g. 15" />
              {errors.averageServiceTime && <p className="text-sm text-red-600">{errors.averageServiceTime.message}</p>}
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-100">
              <Link href="/super-admin/services">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
