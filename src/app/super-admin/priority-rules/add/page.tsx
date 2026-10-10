"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Save, Type, AlignLeft, Building2, MapPin, TrendingUp, Filter } from 'lucide-react';
import Link from 'next/link';

const ruleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description condition is required'),
  priorityMultiplier: z.coerce.number().min(0.1).max(10.0),
  organizationId: z.string().min(1, 'Organization is required'),
  officeId: z.string().optional(),
});

type RuleFormValues = z.infer<typeof ruleSchema>;

export default function AddPriorityRule() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/organizations')
      .then(res => res.json())
      .then(data => { if (data.success) setOrganizations(data.data); })
      .catch(console.error);
  }, []);

  const fetchOffices = async (orgId: string) => {
    try {
      const res = await fetch(`/api/offices?organizationId=${orgId}`);
      const data = await res.json();
      if (data.success) setOffices(data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: { priorityMultiplier: 1.5 }
  });

  const onSubmit = async (data: RuleFormValues) => {
    setIsLoading(true);
    setError('');
    
    try {
      const payload = { ...data };
      if (payload.officeId === 'null') {
        payload.officeId = undefined;
      }

      const res = await fetch('/api/priority-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const result = await res.json();
      
      if (result.success) {
        window.location.href = '/super-admin/priority-rules';
      } else {
        setError(result.message || 'Failed to create rule');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      
      {/* Header */}
      <div className="flex items-center mb-8 px-4 sm:px-6 lg:px-8">
        <Link href="/super-admin/priority-rules">
          <button className="w-12 h-12 mr-4 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-full transition-all text-muted-foreground hover:text-foreground shrink-0 border-0">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Add Priority Rule</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold">Create a new dynamic priority multiplier.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 px-4 sm:px-6 lg:px-8">
        
        {/* Left Column: Context Graphic */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-10 text-center border-0 flex flex-col items-center justify-center min-h-[400px]">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-8">System Rule</p>
            
            <div className="w-32 h-32 rounded-[2rem] bg-background shadow-neu-inset flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 bg-primary/10 rounded-[2rem] blur-xl" />
              <Filter size={48} className="text-primary relative z-10" />
            </div>

            <h3 className="text-xl font-black text-foreground mb-3">Priority Logic</h3>
            <p className="text-sm font-semibold text-muted-foreground">
              Define the conditions and multipliers for automatic queue prioritization.
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
                {/* Rule Name */}
                <div className="space-y-3">
                  <label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">
                    Rule Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Type size={18} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <input 
                      id="name" 
                      {...register('name')} 
                      className="w-full h-14 pl-12 pr-4 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0 placeholder:text-muted-foreground/50"
                      placeholder="e.g. Senior Citizen Priority" 
                    />
                  </div>
                  {errors.name && <p className="text-xs font-bold text-red-500 ml-2">{errors.name.message}</p>}
                </div>

                {/* Multiplier */}
                <div className="space-y-3">
                  <label htmlFor="priorityMultiplier" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">
                    Multiplier <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <TrendingUp size={18} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <input 
                      id="priorityMultiplier" 
                      type="number" 
                      step="0.1" 
                      {...register('priorityMultiplier')} 
                      className="w-full h-14 pl-12 pr-4 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0 placeholder:text-muted-foreground/50"
                    />
                  </div>
                  {errors.priorityMultiplier && <p className="text-xs font-bold text-red-500 ml-2">{errors.priorityMultiplier.message}</p>}
                </div>

                {/* Condition Description */}
                <div className="space-y-3 col-span-1 md:col-span-2">
                  <label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">
                    Condition Description <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <AlignLeft size={18} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <input 
                      id="description" 
                      {...register('description')} 
                      className="w-full h-14 pl-12 pr-4 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0 placeholder:text-muted-foreground/50"
                      placeholder="e.g. Age >= 65" 
                    />
                  </div>
                  {errors.description && <p className="text-xs font-bold text-red-500 ml-2">{errors.description.message}</p>}
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
                        setValue('officeId', 'null');
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
                    Assign Office (Optional)
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <MapPin size={18} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <Select value={watch('officeId') || "null"} onValueChange={(val: any) => { if (val) setValue('officeId', val as string); }} disabled={offices.length === 0}>
                      <SelectTrigger className="w-full h-14 pl-12 pr-4 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0 disabled:opacity-50">
                        <SelectValue placeholder="All Offices">
                          {watch('officeId') === 'null' ? "All Offices" : (offices.find(office => office._id === watch('officeId'))?.name || "All Offices")}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-background shadow-neu border-0 rounded-2xl">
                        <SelectItem value="null" className="text-sm font-bold focus:bg-primary/5 focus:text-primary cursor-pointer rounded-xl my-1">All Offices</SelectItem>
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
                <Link href="/super-admin/priority-rules" className="w-full sm:w-auto">
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
                      SAVE RULE
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
