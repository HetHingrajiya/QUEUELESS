"use client";
import { useState, useEffect, use } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, ArrowLeft, Building2, Save, Mail, Phone, MapPin, Hash, TextCursorInput } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [orgTypes, setOrgTypes] = useState<any[]>([]);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: { status: 'ACTIVE' }
  });

  useEffect(() => {
    // Fetch Organization Types
    fetch('/api/organization-types')
      .then(res => res.json())
      .then(data => {
        if (data.success) setOrgTypes(data.data);
      })
      .catch(err => console.error('Error fetching org types:', err));

    // Fetch Organization Data
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
        <Link href="/super-admin/organizations">
          <button className="w-12 h-12 mr-4 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-full transition-all text-muted-foreground hover:text-foreground shrink-0 border-0">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Edit Organization</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold">Update the details of the government entity.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 px-4 sm:px-6 lg:px-8">
        
        {/* Left Column: Context Graphic */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-10 text-center border-0 flex flex-col items-center justify-center min-h-[400px]">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-8">System Admin</p>
            
            <div className="w-32 h-32 rounded-[2rem] bg-background shadow-neu-inset flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 bg-primary/10 rounded-[2rem] blur-xl" />
              <Building2 size={48} className="text-primary relative z-10" />
            </div>
            
            <h2 className="text-xl font-black text-foreground tracking-tight mb-4">Master Record</h2>
            <p className="text-sm font-semibold text-muted-foreground leading-relaxed max-w-xs">
              This entity represents a top-level organization in the multi-tenant architecture. Updating details here reflects globally across all linked offices and tellers.
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
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Organization Name *</label>
                  <div className="relative">
                    <TextCursorInput size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                    <input
                      {...register('name')}
                      placeholder="e.g. Rajkot Municipal Corporation"
                      className="w-full h-14 pl-14 pr-5 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground/50 border-0 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  {errors.name && <p className="text-[10px] font-bold text-red-500 ml-4 mt-1">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Organization Code *</label>
                  <div className="relative">
                    <Hash size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                    <input
                      {...register('code')}
                      placeholder="e.g. RMC"
                      className="w-full h-14 pl-14 pr-5 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground/50 border-0 focus:ring-2 focus:ring-primary/20 outline-none transition-all uppercase"
                    />
                  </div>
                  {errors.code && <p className="text-[10px] font-bold text-red-500 ml-4 mt-1">{errors.code.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Organization Type *</label>
                  <Select value={watch('type') || ''} onValueChange={(val: string | null) => { if (val) setValue('type', val); }}>
                    <SelectTrigger className="w-full h-14 px-5 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground border-0 focus:ring-0 focus:ring-offset-0 focus:outline-none focus:bg-background/80 transition-all">
                      <SelectValue placeholder="Select type">
                        {watch('type') || "Select type"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-background shadow-neu border-0 rounded-2xl p-2">
                      {orgTypes.length > 0 ? orgTypes.map((t) => (
                        <SelectItem key={t._id} value={t.name} className="focus:bg-primary/10 focus:text-primary rounded-xl font-bold cursor-pointer transition-colors py-3">{t.name}</SelectItem>
                      )) : (
                        <>
                          <SelectItem value="Government" className="focus:bg-primary/10 focus:text-primary rounded-xl font-bold cursor-pointer transition-colors py-3">Government</SelectItem>
                          <SelectItem value="Municipal" className="focus:bg-primary/10 focus:text-primary rounded-xl font-bold cursor-pointer transition-colors py-3">Municipal</SelectItem>
                          <SelectItem value="Healthcare" className="focus:bg-primary/10 focus:text-primary rounded-xl font-bold cursor-pointer transition-colors py-3">Healthcare</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="text-[10px] font-bold text-red-500 ml-4 mt-1">{errors.type.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Status</label>
                  <Select value={watch('status') || 'ACTIVE'} onValueChange={(val: string | null) => { if (val) setValue('status', val); }}>
                    <SelectTrigger className="w-full h-14 px-5 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground border-0 focus:ring-0 focus:ring-offset-0 focus:outline-none focus:bg-background/80 transition-all">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Contact Email *</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                    <input
                      type="email"
                      {...register('email')}
                      placeholder="contact@rmc.gov"
                      className="w-full h-14 pl-14 pr-5 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground/50 border-0 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  {errors.email && <p className="text-[10px] font-bold text-red-500 ml-4 mt-1">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Contact Phone</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                    <input
                      {...register('phone')}
                      placeholder="+91 12345 67890"
                      className="w-full h-14 pl-14 pr-5 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground/50 border-0 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">HQ Address</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-5 top-5 text-primary pointer-events-none" />
                  <textarea
                    {...register('address')}
                    placeholder="Full headquarters address"
                    className="w-full h-24 pl-14 pr-5 py-5 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground/50 border-0 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div className="pt-8 flex flex-col sm:flex-row items-center gap-4">
                <Link href="/super-admin/organizations" className="w-full sm:w-auto">
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
                    <span className="flex items-center"><Save size={18} className="mr-3" /> Save Changes</span>
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
