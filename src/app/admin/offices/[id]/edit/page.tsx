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
import { Loader2, ArrowLeft, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';

const officeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().min(1, 'Pincode is required'),
});

type OfficeFormValues = z.infer<typeof officeSchema>;

export default function AdminEditOffice({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fetching, setFetching] = useState(true);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<OfficeFormValues>({
    resolver: zodResolver(officeSchema),
  });

  useEffect(() => {
    fetch(`/api/offices/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          reset({
            name: data.data.name,
            code: data.data.code,
            address: data.data.address,
            city: data.data.city,
            state: data.data.state,
            pincode: data.data.pincode
          });
        } else {
          setError('Failed to fetch office details');
        }
      })
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [params.id, reset]);

  const onSubmit = async (data: OfficeFormValues) => {
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/offices/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      
      if (result.success) {
        router.push('/admin/offices');
        router.refresh();
      } else {
        setError(result.message || 'Failed to update office');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this office?')) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/offices/${params.id}`, {
        method: 'DELETE',
      });
      
      const result = await res.json();
      
      if (result.success) {
        router.push('/admin/offices');
        router.refresh();
      } else {
        setError(result.message || 'Failed to delete office');
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
    <div className="space-y-6 max-w-4xl mx-auto pb-12 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/admin/offices" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <h2 className="text-2xl font-bold text-slate-800">Edit Office</h2>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 size={16} className="mr-2" />}
          Delete Office
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Office Details</CardTitle>
          <CardDescription>Update configuration for this office branch.</CardDescription>
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
              <Link href="/admin/offices">
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
