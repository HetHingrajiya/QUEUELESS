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

const orgSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  code: z.string().min(1, 'Organization code is required'),
  type: z.string().min(1, 'Type is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  status: z.string()
});

type OrgFormValues = z.infer<typeof orgSchema>;

export default function EditOrganization({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const orgId = unwrappedParams.id;
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [orgTypes, setOrgTypes] = useState<any[]>([]);

  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: { status: 'ACTIVE' }
  });

  useEffect(() => {
    // Fetch Organization Types for the dropdown
    fetch('/api/organization-types')
      .then(res => res.json())
      .then(data => {
        if (data.success) setOrgTypes(data.data);
      })
      .catch(err => console.error('Error fetching org types:', err));

    // Fetch the current organization data
    fetch(`/api/organizations/${orgId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const org = data.data;
          reset({
            name: org.name,
            code: org.code,
            type: org.type,
            email: org.email,
            phone: org.contactNumber || '',
            address: org.address || '',
            status: org.status
          });
          // Ensure Select values are initialized explicitly if needed, but reset() usually handles it
        } else {
          setError('Failed to load organization data');
        }
        setIsFetching(false);
      })
      .catch(err => {
        console.error('Error fetching org:', err);
        setError('Error loading organization data');
        setIsFetching(false);
      });
  }, [orgId, reset]);

  const onSubmit = async (data: OrgFormValues) => {
    setIsLoading(true);
    setError('');
    
    try {
      const payload = { ...data, contactNumber: data.phone };
      delete (payload as any).phone;
      
      const res = await fetch(`/api/organizations/${orgId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const result = await res.json();
      
      if (result.success) {
        window.location.href = '/super-admin/organizations';
      } else {
        setError(result.message || 'Failed to update organization');
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
        <Link href="/super-admin/organizations" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-2xl font-bold text-slate-800">Edit Organization</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>Update the details of the government entity.</CardDescription>
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
                <Label htmlFor="name">Organization Name *</Label>
                <Input id="name" {...register('name')} placeholder="e.g. Rajkot Municipal Corporation" />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Organization Code *</Label>
                <Input id="code" {...register('code')} placeholder="e.g. RMC" />
                {errors.code && <p className="text-sm text-red-600">{errors.code.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Organization Type *</Label>
                <Select value={watch('type') || ""} onValueChange={(val: any) => { if (val) setValue('type', val as string); }}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {orgTypes.length > 0 ? orgTypes.map((t) => (
                      <SelectItem key={t._id} value={t.name}>{t.name}</SelectItem>
                    )) : (
                      <>
                        <SelectItem value="Government">Government</SelectItem>
                        <SelectItem value="Municipal">Municipal</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-sm text-red-600">{errors.type.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={watch('status') || ""} onValueChange={(val: any) => { if (val) setValue('status', val as string); }}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Contact Email *</Label>
                <Input id="email" type="email" {...register('email')} placeholder="contact@rmc.gov" />
                {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Contact Phone</Label>
                <Input id="phone" {...register('phone')} placeholder="+91 12345 67890" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register('address')} placeholder="Full address" />
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-100">
              <Link href="/super-admin/organizations">
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
