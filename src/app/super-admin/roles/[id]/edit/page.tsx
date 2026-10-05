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
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const editRoleSchema = z.object({
  name: z.string().min(1, 'Name is required').toUpperCase(),
  description: z.string().optional(),
});

type EditRoleFormValues = z.infer<typeof editRoleSchema>;

export default function EditRole({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [roleId, setRoleId] = useState('');
  const [isSystem, setIsSystem] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditRoleFormValues>({
    resolver: zodResolver(editRoleSchema),
  });

  useEffect(() => {
    const fetchRoleData = async () => {
      try {
        const id = unwrappedParams.id;
        setRoleId(id);

        const res = await fetch(`/api/roles/${id}`);
        const data = await res.json();
        
        if (data.success) {
          setIsSystem(data.data.isSystem);
          reset({
            name: data.data.name,
            description: data.data.description,
          });
        } else {
          setError('Failed to fetch role data');
        }
      } catch (err) {
        console.error(err);
        setError('Error loading data');
      } finally {
        setIsFetching(false);
      }
    };
    fetchRoleData();
  }, [unwrappedParams.id, reset]);

  const onSubmit = async (data: EditRoleFormValues) => {
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/roles/${roleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      
      if (result.success) {
        router.push('/super-admin/roles');
        router.refresh();
      } else {
        setError(result.message || 'Failed to update role');
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
        <Link href="/super-admin/roles" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-2xl font-bold text-slate-800">Edit Custom Role</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Details</CardTitle>
          <CardDescription>Update custom access role.</CardDescription>
        </CardHeader>
        <CardContent>
          {isSystem && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg">
              This is a system-defined role. You cannot modify it.
            </div>
          )}
          
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); if(!isSystem) handleSubmit(onSubmit)(e); }}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Role Name</Label>
              <Input id="name" {...register('name')} disabled={isSystem} className="uppercase" />
              {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" {...register('description')} disabled={isSystem} />
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-100">
              <Link href="/super-admin/roles">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              {!isSystem && (
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Changes'}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
