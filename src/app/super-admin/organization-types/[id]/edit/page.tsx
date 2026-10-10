"use client";
import { useState, useEffect, use } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, ArrowLeft, Layers, Save, TextCursorInput, MessageSquare, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const typeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.string()
});

type TypeFormValues = z.infer<typeof typeSchema>;

export default function EditOrganizationType({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [typeId, setTypeId] = useState<string>('');

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<TypeFormValues>({
    resolver: zodResolver(typeSchema),
    defaultValues: { status: 'ACTIVE' }
  });

  useEffect(() => {
    const fetchType = async () => {
      try {
        const id = unwrappedParams.id;
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
  }, [unwrappedParams.id, reset]);

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
        window.location.href = '/super-admin/organization-types';
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
        <Link href="/super-admin/organization-types">
          <button className="w-12 h-12 mr-4 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-full transition-all text-muted-foreground hover:text-foreground shrink-0 border-0">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Edit Organization Type</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold">Update the organization category classification.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 px-4 sm:px-6 lg:px-8">
        
        {/* Left Column: Context Graphic */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-10 text-center border-0 flex flex-col items-center justify-center min-h-[400px]">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-8">Classification</p>
            
            <div className="w-32 h-32 rounded-[2rem] bg-background shadow-neu-inset flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 bg-primary/10 rounded-[2rem] blur-xl" />
              <Layers size={48} className="text-primary relative z-10" />
            </div>
            
            <h2 className="text-xl font-black text-foreground tracking-tight mb-4">Edit Category</h2>
            <p className="text-sm font-semibold text-muted-foreground leading-relaxed max-w-xs">
              Updating this classification will automatically reflect on all organizations that are currently assigned to this type.
            </p>
          </div>
        </div>

        {/* Right Column: Editing Form */}
        <div className="lg:col-span-8">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-8 sm:p-10 border-0">
            
            {error && (
              <div className="p-4 mb-8 rounded-2xl bg-background shadow-neu-inset border-2 border-red-500/20 text-red-500 text-sm font-bold flex items-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Type Name *</label>
                  <div className="relative">
                    <TextCursorInput size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                    <input
                      {...register('name')}
                      placeholder="e.g. Healthcare, Municipal"
                      className="w-full h-14 pl-14 pr-5 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground/50 border-0 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  {errors.name && <p className="text-[10px] font-bold text-red-500 ml-4 mt-1">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Status</label>
                  <div className="relative">
                    <ShieldCheck size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary pointer-events-none z-10" />
                    <Select value={watch('status') || 'ACTIVE'} onValueChange={(val: string | null) => { if (val) setValue('status', val); }}>
                      <SelectTrigger className="w-full !h-14 pl-14 pr-5 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground border-0 focus:ring-0 focus:ring-offset-0 focus:outline-none focus:bg-background/80 transition-all">
                        <SelectValue placeholder="Select status">
                          {watch('status') === 'INACTIVE' ? 'Inactive' : 'Active'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-background shadow-neu border-0 rounded-2xl p-2">
                        <SelectItem value="ACTIVE" className="focus:bg-primary/10 focus:text-primary rounded-xl font-bold cursor-pointer transition-colors py-3">Active</SelectItem>
                        <SelectItem value="INACTIVE" className="focus:bg-primary/10 focus:text-primary rounded-xl font-bold cursor-pointer transition-colors py-3">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Description</label>
                <div className="relative">
                  <MessageSquare size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                  <input
                    {...register('description')}
                    placeholder="Brief description of this type"
                    className="w-full h-14 pl-14 pr-5 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground/50 border-0 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-8 flex flex-col sm:flex-row items-center gap-4">
                <Link href="/super-admin/organization-types" className="w-full sm:w-auto">
                  <button type="button" className="w-full h-16 px-8 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl text-xs uppercase font-black tracking-widest text-muted-foreground hover:text-foreground transition-all border-0">
                    Cancel
                  </button>
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:flex-1 h-16 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl text-sm uppercase font-black tracking-widest text-primary flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed border-0"
                >
                  {isLoading ? (
                    <span className="flex items-center"><span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3"></span> Saving...</span>
                  ) : (
                    <span className="flex items-center"><Save size={18} className="mr-3" /> Update Type</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
