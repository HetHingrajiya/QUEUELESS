"use client";
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Save, User, Mail, Building2, MapPin, Users } from 'lucide-react';
import Link from 'next/link';

const staffSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  organizationId: z.string().min(1, 'Organization is required'),
  officeId: z.string().min(1, 'Office is required'),
});

type StaffFormValues = z.infer<typeof staffSchema>;

export default function EditStaff({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
  });

  const fetchOffices = async (orgId: string) => {
    try {
      const res = await fetch(`/api/offices?organizationId=${orgId}`);
      const data = await res.json();
      if (data.success) setOffices(data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        const orgRes = await fetch('/api/organizations');
        const orgData = await orgRes.json();
        if (orgData.success) {
          setOrganizations(orgData.data);
        }

        const staffRes = await fetch(`/api/staff/${unwrappedParams.id}`);
        const staffData = await staffRes.json();
        
        if (staffData.success) {
          const staff = staffData.data;
          if (staff.organizationId) {
            const orgId = typeof staff.organizationId === 'object' && staff.organizationId !== null ? staff.organizationId._id : staff.organizationId;
            const staffOfficeObj = typeof staff.officeId === 'object' && staff.officeId !== null ? staff.officeId : null;
            if (staffOfficeObj && staffOfficeObj._id) {
              setOffices(prev => prev.some(o => o._id === staffOfficeObj._id) ? prev : [...prev, staffOfficeObj]);
            }
            if (orgId) {
              await fetchOffices(orgId);
            }
          }
          reset({
            fullName: staff.fullName,
            email: staff.email,
            organizationId: typeof staff.organizationId === 'object' && staff.organizationId !== null ? staff.organizationId._id : staff.organizationId,
            officeId: typeof staff.officeId === 'object' && staff.officeId !== null ? staff.officeId._id : staff.officeId,
          });
        } else {
          setError('Failed to fetch staff data');
        }
      } catch (err) {
        console.error(err);
        setError('Error loading data');
      } finally {
        setIsFetching(false);
      }
    };
    initializeData();
  }, [unwrappedParams.id, reset]);

  const onSubmit = async (data: StaffFormValues) => {
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/staff/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      
      if (result.success) {
        window.location.href = '/super-admin/staff';
      } else {
        setError(result.message || 'Failed to update staff');
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
        <Link href="/super-admin/staff">
          <button className="w-12 h-12 mr-4 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-full transition-all text-muted-foreground hover:text-foreground shrink-0 border-0">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Edit Staff</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold">Update staff member information.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 px-4 sm:px-6 lg:px-8">
        
        {/* Left Column: Context Graphic */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-10 text-center border-0 flex flex-col items-center justify-center min-h-[400px]">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-8">System Account</p>
            
            <div className="w-32 h-32 rounded-[2rem] bg-background shadow-neu-inset flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 bg-primary/10 rounded-[2rem] blur-xl" />
              <Users size={48} className="text-primary relative z-10" />
            </div>

            <h3 className="text-xl font-black text-foreground mb-3">Staff Profile</h3>
            <p className="text-sm font-semibold text-muted-foreground">
              Update the authentication details and location assignment for this user.
            </p>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-8">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0">
            <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(e); }}>
              
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold flex items-center justify-center">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Full Name */}
                <div className="space-y-3">
                  <label htmlFor="fullName" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User size={18} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <input 
                      id="fullName" 
                      {...register('fullName')} 
                      className="w-full h-14 pl-12 pr-4 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0 placeholder:text-muted-foreground/50"
                      placeholder="e.g. Jane Doe" 
                    />
                  </div>
                  {errors.fullName && <p className="text-xs font-bold text-red-500 ml-2">{errors.fullName.message}</p>}
                </div>

                {/* Email Address */}
                <div className="space-y-3">
                  <label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail size={18} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <input 
                      id="email" 
                      type="email"
                      {...register('email')} 
                      className="w-full h-14 pl-12 pr-4 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0 placeholder:text-muted-foreground/50"
                      placeholder="staff@domain.com" 
                    />
                  </div>
                  {errors.email && <p className="text-xs font-bold text-red-500 ml-2">{errors.email.message}</p>}
                </div>

                {/* Organization */}
                <div className="space-y-3">
                  <label htmlFor="organizationId" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">
                    Organization <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <Building2 size={18} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <Select value={watch('organizationId') || ""} onValueChange={(val: any) => { 
                      if (val) {
                        setValue('organizationId', val as string); 
                        fetchOffices(val as string);
                        setValue('officeId', '');
                      }
                    }}>
                      <SelectTrigger className="w-full h-14 pl-12 pr-4 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0">
                        <SelectValue placeholder="Select organization">
                          {organizations.find(org => org._id === watch('organizationId'))?.name || "Select organization"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-background shadow-neu border-0 rounded-2xl">
                        {organizations.map(org => (
                          <SelectItem key={org._id} value={org._id} className="text-sm font-bold focus:bg-primary/5 focus:text-primary cursor-pointer rounded-xl my-1">
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.organizationId && <p className="text-xs font-bold text-red-500 ml-2">{errors.organizationId.message}</p>}
                </div>

                {/* Office */}
                <div className="space-y-3">
                  <label htmlFor="officeId" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">
                    Office <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <MapPin size={18} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <Select value={(typeof watch('officeId') === 'object' && watch('officeId') !== null ? (watch('officeId') as any)?._id : watch('officeId')) || ""} onValueChange={(val: any) => { if (val) setValue('officeId', val as string); }} disabled={offices.length === 0}>
                      <SelectTrigger className="w-full h-14 pl-12 pr-4 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0 disabled:opacity-50">
                        <SelectValue placeholder="Select office">
                          {offices.find(office => office._id === (typeof watch('officeId') === 'object' ? (watch('officeId') as any)?._id : watch('officeId')))?.name || "Select office"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-background shadow-neu border-0 rounded-2xl">
                        {offices.map(office => (
                          <SelectItem key={office._id} value={office._id} className="text-sm font-bold focus:bg-primary/5 focus:text-primary cursor-pointer rounded-xl my-1">
                            {office.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.officeId && <p className="text-xs font-bold text-red-500 ml-2">{errors.officeId.message}</p>}
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-8">
                <Link href="/super-admin/staff" className="w-full sm:w-auto">
                  <button type="button" className="w-full sm:w-auto h-14 px-8 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl text-sm font-black tracking-widest text-slate-500 hover:text-foreground transition-all border-0">
                    CANCEL
                  </button>
                </Link>
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
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
