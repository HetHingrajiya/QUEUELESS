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
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const editAdminSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().optional(),
  organizationId: z.string().min(1, 'Organization is required'),
});

type EditAdminFormValues = z.infer<typeof editAdminSchema>;

export default function EditAdmin({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [adminId, setAdminId] = useState<string>('');

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<EditAdminFormValues>({
    resolver: zodResolver(editAdminSchema),
  });

  useEffect(() => {
    const fetchOrganizationsAndAdmin = async () => {
      try {
        const id = unwrappedParams.id;
        setAdminId(id);

        const [orgsRes, adminRes] = await Promise.all([
          fetch('/api/organizations'),
          fetch(`/api/admins/${id}`)
        ]);

        const orgsData = await orgsRes.json();
        const adminData = await adminRes.json();

        if (orgsData.success) {
          setOrganizations(orgsData.data);
        }

        if (adminData.success && adminData.data) {
          reset({
            fullName: adminData.data.fullName,
            email: adminData.data.email,
            organizationId: adminData.data.organizationId,
          });
        } else {
          setError('Failed to load admin data');
        }
      } catch (err) {
        setError('Error fetching data');
      } finally {
        setIsFetching(false);
      }
    };

    fetchOrganizationsAndAdmin();
  }, [unwrappedParams.id, reset]);

  const onSubmit = async (data: EditAdminFormValues) => {
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/admins/${adminId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      
      if (result.success) {
        router.push('/super-admin/admins');
        router.refresh();
      } else {
        setError(result.message || 'Failed to update admin');
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
        <Link href="/super-admin/admins" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-2xl font-bold text-slate-800">Edit Admin</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Details</CardTitle>
          <CardDescription>Update administrator information.</CardDescription>
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
                <Input id="fullName" {...register('fullName')} placeholder="e.g. John Doe" />
                {errors.fullName && <p className="text-sm text-red-600">{errors.fullName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input id="email" type="email" {...register('email')} placeholder="admin@domain.com" />
                {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password (Leave blank to keep unchanged)</Label>
                <Input id="password" type="password" {...register('password')} placeholder="••••••••" />
                {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">Assign Organization *</Label>
                <Select value={watch('organizationId') || ""} onValueChange={(val: any) => { if (val) setValue('organizationId', val as string); }}>
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
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-100">
              <Link href="/super-admin/admins">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Update Admin'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
