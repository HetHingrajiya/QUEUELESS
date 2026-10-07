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

const roleSchema = z.object({
  name: z.string().min(1, 'Name is required').toUpperCase(),
  description: z.string().optional(),
  organizationId: z.string().optional(),
});

type RoleFormValues = z.infer<typeof roleSchema>;

export default function AddRole() {
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

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
  });

  const onSubmit = async (data: RoleFormValues) => {
    setIsLoading(true);
    setError('');
    
    try {
      // For custom roles, we set isSystem to false implicitly, but server handles it based on role anyway.
      const payload = {
         ...data,
         isSystem: false
      };
      if (payload.organizationId === 'GLOBAL') {
         delete payload.organizationId;
         payload.isSystem = true; // Super admins can create global roles
      }

      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const result = await res.json();
      
      if (result.success) {
        window.location.href = '/super-admin/roles';
      } else {
        setError(result.message || 'Failed to create role');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12 p-6">
      <div className="flex items-center mb-6">
        <Link href="/super-admin/roles" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-2xl font-bold text-slate-800">Add Custom Role</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Details</CardTitle>
          <CardDescription>Create a new custom access role for your system or organizations.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(e); }}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Role Name (e.g., BRANCH_MANAGER) *</Label>
              <Input id="name" {...register('name')} placeholder="e.g. MANAGER" className="uppercase" />
              {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" {...register('description')} placeholder="Brief description of this role" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization">Assign Organization</Label>
              <Select value={watch('organizationId') || ""} onValueChange={(val: any) => { if (val) setValue('organizationId', val as string); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select organization (Optional)">
                    {watch('organizationId') === 'GLOBAL' ? 'Global (All Organizations)' : organizations.find(org => org._id === watch('organizationId'))?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GLOBAL">Global (All Organizations)</SelectItem>
                  {organizations.map(org => (
                    <SelectItem key={org._id} value={org._id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-100">
              <Link href="/super-admin/roles">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Create Role'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
