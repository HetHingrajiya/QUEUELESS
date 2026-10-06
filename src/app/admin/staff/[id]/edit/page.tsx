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

const staffSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().optional(),
  officeId: z.string().min(1, 'Office is required'),
});

type StaffFormValues = z.infer<typeof staffSchema>;

export default function AdminEditStaff({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  
  const [offices, setOffices] = useState<any[]>([]);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
  });

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

    // 2. Fetch staff data
    fetch(`/api/staff/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          reset({
            fullName: data.data.fullName,
            email: data.data.email,
            officeId: data.data.officeId,
          });
        } else {
          setError('Failed to fetch staff details');
        }
      })
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [id, reset]);

  const onSubmit = async (data: StaffFormValues) => {
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      
      if (result.success) {
        router.push('/admin/staff');
        router.refresh();
      } else {
        setError(result.message || 'Failed to update staff member');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: 'DELETE',
      });
      
      const result = await res.json();
      
      if (result.success) {
        router.push('/admin/staff');
        router.refresh();
      } else {
        setError(result.message || 'Failed to delete staff member');
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
          <Link href="/admin/staff" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <h2 className="text-2xl font-bold text-slate-800">Edit Staff</h2>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 size={16} className="mr-2" />}
          Delete Staff
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Details</CardTitle>
          <CardDescription>Update configuration and assignment for this staff member.</CardDescription>
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
                <Label htmlFor="password">Reset Password (Optional)</Label>
                <Input id="password" type="password" {...register('password')} placeholder="Leave blank to keep unchanged" />
                {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
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

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-100">
              <Link href="/admin/staff">
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
