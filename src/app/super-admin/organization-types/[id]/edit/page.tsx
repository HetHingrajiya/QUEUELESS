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

const typeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.string()
});

type TypeFormValues = z.infer<typeof typeSchema>;

export default function EditOrganizationType({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [typeId, setTypeId] = useState<string>('');

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<TypeFormValues>({
    resolver: zodResolver(typeSchema),
    defaultValues: { status: 'ACTIVE' }
  });

  useEffect(() => {
    const fetchType = async () => {
      try {
        const { id } = await params;
        setTypeId(id);

        const res = await fetch(`/api/organization-types/${id}`);
        const json = await res.json();

        if (json.success && json.data) {
          reset({
            name: json.data.name,
            description: json.data.description || '',
            status: json.data.status || 'ACTIVE'
          });
        } else {
          setError('Failed to load organization type data');
        }
      } catch (err) {
        setError('Error fetching data');
      } finally {
        setIsFetching(false);
      }
    };

    fetchType();
  }, [params, reset]);

  const onSubmit = async (data: TypeFormValues) => {
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/organization-types/${typeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      
      if (result.success) {
        router.push('/super-admin/organization-types');
        router.refresh();
      } else {
        setError(result.message || 'Failed to update organization type');
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
        <Link href="/super-admin/organization-types" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-2xl font-bold text-slate-800">Edit Organization Type</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Type Details</CardTitle>
          <CardDescription>Update the organization category classification.</CardDescription>
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
                <Label htmlFor="name">Type Name *</Label>
                <Input id="name" {...register('name')} placeholder="e.g. Healthcare, Municipal" />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={watch('status') || "ACTIVE"} onValueChange={(val: any) => { if (val) setValue('status', val as string); }}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" {...register('description')} placeholder="Brief description of this type" />
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-100">
              <Link href="/super-admin/organization-types">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Update Type'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
