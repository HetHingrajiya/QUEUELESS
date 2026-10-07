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

const officeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  organizationId: z.string().min(1, 'Organization is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().min(1, 'Pincode is required'),
});

type OfficeFormValues = z.infer<typeof officeSchema>;

export default function AddOffice() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/organizations')
      .then(res => res.json())
      .then(data => { if (data.success) setOrganizations(data.data); })
      .catch(console.error);
  }, []);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<OfficeFormValues>({
    resolver: zodResolver(officeSchema),
  });

  const onSubmit = async (data: OfficeFormValues) => {
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/offices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      
      if (result.success) {
        window.location.href = '/super-admin/offices';
      } else {
        setError(result.message || 'Failed to create office');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 p-6">
      <div className="flex items-center mb-6">
        <Link href="/super-admin/offices" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-2xl font-bold text-slate-800">Add New Office</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Office Details</CardTitle>
          <CardDescription>Register a new office branch under an organization.</CardDescription>
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
                <Label htmlFor="name">Office Name *</Label>
                <Input id="name" {...register('name')} placeholder="e.g. RMC Main Branch" />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Office Code *</Label>
                <Input id="code" {...register('code')} placeholder="e.g. RMC-01" />
                {errors.code && <p className="text-sm text-red-600">{errors.code.message}</p>}
              </div>
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

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input id="address" {...register('address')} placeholder="Full street address" />
              {errors.address && <p className="text-sm text-red-600">{errors.address.message}</p>}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input id="city" {...register('city')} placeholder="e.g. Rajkot" />
                {errors.city && <p className="text-sm text-red-600">{errors.city.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Select value={watch('state') || ""} onValueChange={(val: string) => setValue('state', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state">
                      {watch('state')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"].map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.state && <p className="text-sm text-red-600">{errors.state.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode *</Label>
                <Input id="pincode" {...register('pincode')} placeholder="e.g. 360001" />
                {errors.pincode && <p className="text-sm text-red-600">{errors.pincode.message}</p>}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-100">
              <Link href="/super-admin/offices">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Create Office'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
