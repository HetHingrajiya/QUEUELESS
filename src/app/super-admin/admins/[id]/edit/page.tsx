"use client";
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, ArrowLeft, UserCog, Mail, Lock, Building2, TextCursorInput, Save } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
        window.location.href = '/super-admin/admins';
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
        <Link href="/super-admin/admins">
          <button className="w-12 h-12 mr-4 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-full transition-all text-muted-foreground hover:text-foreground shrink-0 border-0">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Edit Admin</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold">Update administrator information and access rights.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 px-4 sm:px-6 lg:px-8">
        
        {/* Left Column: Context Graphic */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-10 text-center border-0 flex flex-col items-center justify-center min-h-[400px]">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-8">Access Control</p>
            
            <div className="w-32 h-32 rounded-[2rem] bg-background shadow-neu-inset flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 bg-primary/10 rounded-[2rem] blur-xl" />
              <UserCog size={48} className="text-primary relative z-10" />
            </div>
            
            <h2 className="text-xl font-black text-foreground tracking-tight mb-4">Edit Authority</h2>
            <p className="text-sm font-semibold text-muted-foreground leading-relaxed max-w-xs">
              Updating these credentials modifies the administrative access for this user. You can also reassign them to a different organization here.
            </p>
          </div>
        </div>

        {/* Right Column: Update Form */}
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
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Full Name *</label>
                  <div className="relative">
                    <TextCursorInput size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                    <input
                      {...register('fullName')}
                      placeholder="e.g. John Doe"
                      className="w-full h-14 pl-14 pr-5 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground/50 border-0 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  {errors.fullName && <p className="text-[10px] font-bold text-red-500 ml-4 mt-1">{errors.fullName.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Email Address *</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                    <input
                      type="email"
                      {...register('email')}
                      placeholder="admin@domain.com"
                      className="w-full h-14 pl-14 pr-5 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground/50 border-0 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  {errors.email && <p className="text-[10px] font-bold text-red-500 ml-4 mt-1">{errors.email.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                    <input
                      type="password"
                      {...register('password')}
                      placeholder="Leave blank to keep unchanged"
                      className="w-full h-14 pl-14 pr-5 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground/50 border-0 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  {errors.password && <p className="text-[10px] font-bold text-red-500 ml-4 mt-1">{errors.password.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Assign Organization *</label>
                  <div className="relative">
                    <Building2 size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary pointer-events-none z-10" />
                    <Select value={watch('organizationId') || ""} onValueChange={(val: any) => { if (val) setValue('organizationId', val as string); }}>
                      <SelectTrigger className="w-full !h-14 pl-14 pr-5 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground border-0 focus:ring-0 focus:ring-offset-0 focus:outline-none focus:bg-background/80 transition-all">
                        <SelectValue placeholder="Select organization">
                          {watch('organizationId') ? organizations.find(org => org._id === watch('organizationId'))?.name : "Select organization"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-background shadow-neu border-0 rounded-2xl p-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {organizations.map(org => (
                          <SelectItem key={org._id} value={org._id} className="focus:bg-primary/10 focus:text-primary rounded-xl font-bold cursor-pointer transition-colors py-3">{org.name}</SelectItem>
                        ))}
                        {organizations.length === 0 && (
                          <div className="py-4 px-2 text-sm text-center font-bold text-muted-foreground">Loading organizations...</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.organizationId && <p className="text-[10px] font-bold text-red-500 ml-4 mt-1">{errors.organizationId.message}</p>}
                </div>
              </div>

              <div className="pt-8 flex flex-col sm:flex-row items-center gap-4">
                <Link href="/super-admin/admins" className="w-full sm:w-auto">
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
                    <span className="flex items-center"><Save size={18} className="mr-3" /> Update Admin</span>
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
