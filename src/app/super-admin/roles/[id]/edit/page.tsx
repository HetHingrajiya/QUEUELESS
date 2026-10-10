"use client";
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, ArrowLeft, Save, Type, AlignLeft, Shield, AlertTriangle } from 'lucide-react';
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
        window.location.href = '/super-admin/roles';
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
        <div className="w-16 h-16 rounded-2xl bg-background shadow-neu flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      
      {/* Header */}
      <div className="flex items-center mb-8 px-4 sm:px-6 lg:px-8">
        <Link href="/super-admin/roles">
          <button className="w-12 h-12 mr-4 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-full transition-all text-muted-foreground hover:text-foreground shrink-0 border-0">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{isSystem ? 'View System Role' : 'Edit Custom Role'}</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold">{isSystem ? 'System roles cannot be modified.' : 'Update custom access role.'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 px-4 sm:px-6 lg:px-8">
        
        {/* Left Column: Context Graphic */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-10 text-center border-0 flex flex-col items-center justify-center min-h-[400px]">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-8">System Access</p>
            
            <div className="w-32 h-32 rounded-[2rem] bg-background shadow-neu-inset flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 bg-primary/10 rounded-[2rem] blur-xl" />
              <Shield size={48} className="text-primary relative z-10" />
            </div>

            <h3 className="text-xl font-black text-foreground mb-3">Role Profile</h3>
            <p className="text-sm font-semibold text-muted-foreground">
              {isSystem ? 'Review the properties of this system-defined role.' : 'Modify the properties of this custom access role.'}
            </p>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-8">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0">
            {isSystem && (
              <div className="mb-8 p-4 bg-background shadow-neu-inset border-0 rounded-2xl flex items-center gap-3">
                <AlertTriangle size={20} className="text-blue-500" />
                <p className="text-sm font-bold text-blue-500">This is a system-defined role. You cannot modify it.</p>
              </div>
            )}
          
            <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); if(!isSystem) handleSubmit(onSubmit)(e); }}>
              
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold flex items-center justify-center">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-8">
                {/* Role Name */}
                <div className="space-y-3">
                  <label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">
                    Role Name
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Type size={18} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <input 
                      id="name" 
                      {...register('name')} 
                      disabled={isSystem}
                      className="w-full h-14 pl-12 pr-4 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0 placeholder:text-muted-foreground/50 uppercase disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>
                  {errors.name && <p className="text-xs font-bold text-red-500 ml-2">{errors.name.message}</p>}
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">
                    Description
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <AlignLeft size={18} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <input 
                      id="description" 
                      {...register('description')} 
                      disabled={isSystem}
                      className="w-full h-14 pl-12 pr-4 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0 placeholder:text-muted-foreground/50 disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-8">
                <Link href="/super-admin/roles" className="w-full sm:w-auto">
                  <button type="button" className="w-full sm:w-auto h-14 px-8 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl text-sm font-black tracking-widest text-slate-500 hover:text-foreground transition-all border-0">
                    {isSystem ? 'BACK TO ROLES' : 'CANCEL'}
                  </button>
                </Link>
                {!isSystem && (
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full sm:w-auto h-14 px-8 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl text-sm font-black tracking-widest text-primary flex items-center justify-center transition-all border-0 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin w-5 h-5" />
                    ) : (
                      <>
                        <Save size={18} className="mr-2" />
                        SAVE CHANGES
                      </>
                    )}
                  </button>
                )}
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
