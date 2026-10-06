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
import { Loader2, ArrowLeft, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';

const counterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  number: z.coerce.number().min(1, 'Number must be greater than 0'),
  officeId: z.string().min(1, 'Office is required'),
  serviceId: z.string().min(1, 'Service is required'),
  staffId: z.string().optional(),
  status: z.string().optional(),
});

type CounterFormValues = z.infer<typeof counterSchema>;

export default function AdminEditCounter({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  
  const [offices, setOffices] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<CounterFormValues>({
    resolver: zodResolver(counterSchema),
  });

  const fetchServicesAndStaff = async (officeId: string) => {
    try {
      const [resServices, resStaff] = await Promise.all([
        fetch(`/api/services?officeId=${officeId}`),
        fetch(`/api/staff?officeId=${officeId}&role=STAFF`)
      ]);
      const dataServices = await resServices.json();
      const dataStaff = await resStaff.json();
      
      if (dataServices.success) setServices(dataServices.data);
      if (dataStaff.success) setStaff(dataStaff.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    // 1. Fetch current admin user to get their organizationId
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.user.organizationId) {
          fetch(`/api/offices?organizationId=${data.data.user.organizationId}`)
            .then(res => res.json())
            .then(officeData => {
              if (officeData.success) setOffices(officeData.data);
            });
        }
      })
      .catch(console.error);

    // 2. Fetch counter data
    fetch(`/api/counters/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          reset({
            name: data.data.name,
            number: data.data.number,
            officeId: data.data.officeId,
            serviceId: data.data.serviceId,
            staffId: data.data.staffId || 'none',
            status: data.data.status || 'OFFLINE'
          });
          if (data.data.officeId) {
            fetchServicesAndStaff(data.data.officeId);
          }
        } else {
          setError('Failed to fetch counter details');
        }
      })
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [id, reset]);

  const onSubmit = async (data: CounterFormValues) => {
    setIsLoading(true);
    setError('');
    
    try {
      const payload = { ...data, staffId: data.staffId === 'none' ? null : data.staffId };
      const res = await fetch(`/api/counters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const result = await res.json();
      
      if (result.success) {
        router.push('/admin/counters');
        router.refresh();
      } else {
        setError(result.message || 'Failed to update counter');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this counter?')) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/counters/${id}`, {
        method: 'DELETE',
      });
      
      const result = await res.json();
      
      if (result.success) {
        router.push('/admin/counters');
        router.refresh();
      } else {
        setError(result.message || 'Failed to delete counter');
        setIsDeleting(false);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsDeleting(false);
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
    <div className="space-y-6 max-w-3xl mx-auto pb-12 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/admin/counters" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <h2 className="text-2xl font-bold text-slate-800">Edit Counter</h2>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 size={16} className="mr-2" />}
          Delete Counter
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Counter Details</CardTitle>
          <CardDescription>Update configuration and assignment for this counter.</CardDescription>
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
                    setValue('staffId', ''); // Reset staff when office changes
                    fetchServicesAndStaff(val as string);
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

            <div className="space-y-2">
              <Label htmlFor="staff">Assign Staff</Label>
              <Select 
                value={watch('staffId') || ""} 
                onValueChange={(val: any) => setValue('staffId', val as string)} 
                disabled={!watch('officeId') || staff.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!watch('officeId') ? "Select an office first" : (staff.length === 0 ? "No staff found" : "Select staff")}>
                    {staff.find(s => s._id === watch('staffId'))?.fullName}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {staff.map(s => (
                    <SelectItem key={s._id} value={s._id}>{s.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={watch('status') || "OFFLINE"} onValueChange={(val: string) => setValue('status', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status">
                    {watch('status')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="OFFLINE">OFFLINE</SelectItem>
                  <SelectItem value="PAUSED">PAUSED</SelectItem>
                  <SelectItem value="MAINTENANCE">MAINTENANCE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-100">
              <Link href="/admin/counters">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save size={16} className="mr-2" /> Save Changes</>}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
