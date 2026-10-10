"use client";
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Hash, Save, Type, Building2, MapPin, MonitorDot, LayoutTemplate, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const counterSchema = z.object({
  number: z.string().min(1, 'Counter number is required'),
  name: z.string().optional(),
  organizationId: z.string().min(1, 'Organization is required'),
  officeId: z.string().min(1, 'Office is required'),
  serviceIds: z.array(z.string()).optional(),
  status: z.string()
});

type CounterFormValues = z.infer<typeof counterSchema>;

export default function EditCounter({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<CounterFormValues>({
    resolver: zodResolver(counterSchema),
    defaultValues: { serviceIds: [] }
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

  const fetchServices = async (officeId: string) => {
    try {
      const res = await fetch(`/api/services?officeId=${officeId}`);
      const data = await res.json();
      if (data.success) setServices(data.data);
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

        const counterRes = await fetch(`/api/counters/${unwrappedParams.id}`);
        const counterData = await counterRes.json();
        
        if (counterData.success) {
          const counter = counterData.data;
          
          const officeRes = await fetch(`/api/offices/${counter.officeId}`);
          const officeData = await officeRes.json();
          const orgId = officeData.success ? officeData.data.organizationId : '';
          
          if (orgId) {
            await fetchOffices(orgId);
          }
          await fetchServices(counter.officeId);

          reset({
            number: counter.number.toString(),
            name: counter.name || '',
            organizationId: orgId,
            officeId: counter.officeId,
            serviceIds: counter.serviceIds && counter.serviceIds.length > 0 ? counter.serviceIds : (counter.serviceId ? [counter.serviceId] : []),
            status: counter.status || 'OFFLINE'
          });
        } else {
          setError('Failed to fetch counter data');
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

  const onSubmit = async (data: CounterFormValues) => {
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/counters/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      
      if (result.success) {
        window.location.href = '/super-admin/counters';
      } else {
        setError(result.message || 'Failed to update counter');
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
        <Link href="/super-admin/counters">
          <button className="w-12 h-12 mr-4 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-full transition-all text-muted-foreground hover:text-foreground shrink-0 border-0">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Edit Counter</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold">Update service counter information.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 px-4 sm:px-6 lg:px-8">
        
        {/* Left Column: Context Graphic */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-10 text-center border-0 flex flex-col items-center justify-center min-h-[400px]">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-8">System Counter</p>
            
            <div className="w-32 h-32 rounded-[2rem] bg-background shadow-neu-inset flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 bg-primary/10 rounded-[2rem] blur-xl" />
              <MonitorDot size={48} className="text-primary relative z-10" />
            </div>

            <h3 className="text-xl font-black text-foreground mb-3">Counter Details</h3>
            <p className="text-sm font-semibold text-muted-foreground">
              Configure a physical or digital counter for servicing queue tickets.
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
                {/* Number */}
                <div className="space-y-3">
                  <label htmlFor="number" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">
                    Counter Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Hash size={18} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <input 
                      id="number" 
                      {...register('number')} 
                      className="w-full h-14 pl-12 pr-4 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0 placeholder:text-muted-foreground/50"
                      placeholder="e.g. 1" 
                    />
                  </div>
                  {errors.number && <p className="text-xs font-bold text-red-500 ml-2">{errors.number.message}</p>}
                </div>

                {/* Name */}
                <div className="space-y-3">
                  <label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">
                    Counter Name
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Type size={18} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <input 
                      id="name" 
                      {...register('name')} 
                      className="w-full h-14 pl-12 pr-4 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0 placeholder:text-muted-foreground/50"
                      placeholder="e.g. Express Desk" 
                    />
                  </div>
                  {errors.name && <p className="text-xs font-bold text-red-500 ml-2">{errors.name.message}</p>}
                </div>

                {/* Organization */}
                <div className="space-y-3">
                  <label htmlFor="organizationId" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">
                    Assign Organization <span className="text-red-500">*</span>
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
                        setValue('serviceIds', []);
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
                    Assign Office <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <MapPin size={18} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <Select value={watch('officeId') || ""} onValueChange={(val: any) => { 
                      if (val) {
                        setValue('officeId', val as string);
                        fetchServices(val as string);
                        setValue('serviceIds', []);
                      }
                    }} disabled={offices.length === 0}>
                      <SelectTrigger className="w-full h-14 pl-12 pr-4 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0 disabled:opacity-50">
                        <SelectValue placeholder="Select office">
                          {offices.find(office => office._id === watch('officeId'))?.name || "Select office"}
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

                {/* Services */}
                <div className="space-y-3 col-span-1 md:col-span-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">
                    Assign Services
                  </label>
                  <div className="bg-background shadow-neu-inset rounded-[2rem] p-6 max-h-60 overflow-y-auto custom-scrollbar relative border-0">
                    {offices.length > 0 && !watch('officeId') ? (
                      <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full py-4">
                        <MapPin size={24} className="mb-2 opacity-50" />
                        <p className="text-xs font-bold">Select an office first to see services</p>
                      </div>
                    ) : services.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full py-4">
                        <LayoutTemplate size={24} className="mb-2 opacity-50" />
                        <p className="text-xs font-bold">No services found for this office (All Services Default)</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {services.map(s => {
                          const currentServiceIds = watch('serviceIds') || [];
                          const isChecked = currentServiceIds.includes(s._id);
                          return (
                            <label key={s._id} className="flex items-center gap-3 cursor-pointer group">
                              <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${isChecked ? 'bg-primary shadow-neu text-white' : 'bg-background shadow-neu-inset text-transparent group-hover:bg-primary/10'}`}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={isChecked ? 'opacity-100' : 'opacity-0'}>
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                              <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{s.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Status */}
                <div className="space-y-3">
                  <label htmlFor="status" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">
                    Status
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <ShieldCheck size={18} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <Select value={watch('status') || ""} onValueChange={(val: any) => { if (val) setValue('status', val as string); }}>
                      <SelectTrigger className="w-full h-14 pl-12 pr-4 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0">
                        <SelectValue placeholder="Select status">
                          {watch('status') === 'ACTIVE' ? 'Active' : watch('status') === 'SERVING' ? 'Serving' : 'Offline'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-background shadow-neu border-0 rounded-2xl">
                        <SelectItem value="ACTIVE" className="text-sm font-bold focus:bg-primary/5 focus:text-primary cursor-pointer rounded-xl my-1">Active</SelectItem>
                        <SelectItem value="SERVING" className="text-sm font-bold focus:bg-primary/5 focus:text-primary cursor-pointer rounded-xl my-1">Serving</SelectItem>
                        <SelectItem value="OFFLINE" className="text-sm font-bold focus:bg-primary/5 focus:text-primary cursor-pointer rounded-xl my-1">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-8">
                <Link href="/super-admin/counters" className="w-full sm:w-auto">
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
