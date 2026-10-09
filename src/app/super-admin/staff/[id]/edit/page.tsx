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

const staffSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  organizationId: z.string().min(1, 'Organization is required'),
  officeId: z.string().min(1, 'Office is required'),
});

type StaffFormValues = z.infer<typeof staffSchema>;

export default function EditStaff({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
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

        const staffRes = await fetch(`/api/staff/${unwrappedParams.id}`);
        const staffData = await staffRes.json();
        
        if (staffData.success) {
          const staff = staffData.data;
          if (staff.organizationId) {
            const orgId = typeof staff.organizationId === 'object' && staff.organizationId !== null ? staff.organizationId._id : staff.organizationId;
            const staffOfficeObj = typeof staff.officeId === 'object' && staff.officeId !== null ? staff.officeId : null;
            if (staffOfficeObj && staffOfficeObj._id) {
              setOffices(prev => prev.some(o => o._id === staffOfficeObj._id) ? prev : [...prev, staffOfficeObj]);
            }
            if (orgId) {
              await fetchOffices(orgId);
            }
          }
          reset({
            fullName: staff.fullName,
            email: staff.email,
            organizationId: typeof staff.organizationId === 'object' && staff.organizationId !== null ? staff.organizationId._id : staff.organizationId,
            officeId: typeof staff.officeId === 'object' && staff.officeId !== null ? staff.officeId._id : staff.officeId,
          });
        } else {
          setError('Failed to fetch staff data');
        }
      } catch (err) {
        console.error(err);
        setError('Error loading data');
      } finally {
        setIsFetching(false);
      }
    };
    initializeData();
  }, [unwrappedParams.id, reset]);

  const onSubmit = async (data: StaffFormValues) => {
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/staff/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      
      if (result.success) {
        window.location.href = '/super-admin/staff';
      } else {
        setError(result.message || 'Failed to update staff');
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
        <Link href="/super-admin/staff" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-2xl font-bold text-slate-800">Edit Staff Member</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Details</CardTitle>
          <CardDescription>Update staff member information.</CardDescription>
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
                <Label htmlFor="fullName">Full Name *</Label>
                <Input id="fullName" {...register('fullName')} placeholder="e.g. Jane Doe" />
                {errors.fullName && <p className="text-sm text-red-600">{errors.fullName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input id="email" type="email" {...register('email')} placeholder="staff@domain.com" />
                {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="organization">Organization *</Label>
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
                <Label htmlFor="office">Office *</Label>
                <Select value={(typeof watch('officeId') === 'object' && watch('officeId') !== null ? (watch('officeId') as any)?._id : watch('officeId')) || ""} onValueChange={(val: any) => { if (val) setValue('officeId', val as string); }} disabled={offices.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select office">
                      {offices.find(office => office._id === (typeof watch('officeId') === 'object' ? (watch('officeId') as any)?._id : watch('officeId')))?.name}
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

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-100">
              <Link href="/super-admin/staff">
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
