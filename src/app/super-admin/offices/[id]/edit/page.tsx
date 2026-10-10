"use client";
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, ArrowLeft, Building2, Plus, MapPin, TextCursorInput, Hash, Building, Map, LocateFixed, Hash as HashIcon, Globe, Save } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const officeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  organizationId: z.string().min(1, 'Organization is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().min(1, 'Pincode is required'),
  latitude: z.string().optional().refine(val => !val || (!isNaN(Number(val)) && Number(val) >= -90 && Number(val) <= 90), "Latitude must be between -90 and 90"),
  longitude: z.string().optional().refine(val => !val || (!isNaN(Number(val)) && Number(val) >= -180 && Number(val) <= 180), "Longitude must be between -180 and 180"),
});

type OfficeFormValues = z.infer<typeof officeSchema>;

export default function EditOffice({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [officeId, setOfficeId] = useState<string>('');

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<OfficeFormValues>({
    resolver: zodResolver(officeSchema),
  });

  useEffect(() => {
    const fetchOrganizationsAndOffice = async () => {
      try {
        const id = unwrappedParams.id;
        setOfficeId(id);

        const [orgsRes, officeRes] = await Promise.all([
          fetch('/api/organizations'),
          fetch(`/api/offices/${id}`)
        ]);

        const orgsData = await orgsRes.json();
        const officeData = await officeRes.json();

        if (orgsData.success) {
          setOrganizations(orgsData.data);
        }

        if (officeData.success && officeData.data) {
          reset({
            name: officeData.data.name,
            code: officeData.data.code,
            organizationId: officeData.data.organizationId,
            address: officeData.data.address,
            city: officeData.data.city,
            state: officeData.data.state,
            pincode: officeData.data.pincode,
            latitude: officeData.data.latitude ? String(officeData.data.latitude) : '',
            longitude: officeData.data.longitude ? String(officeData.data.longitude) : '',
          });
        } else {
          setError('Failed to load office data');
        }
      } catch (err) {
        setError('Error fetching data');
      } finally {
        setIsFetching(false);
      }
    };

    fetchOrganizationsAndOffice();
  }, [unwrappedParams.id, reset]);

  const onSubmit = async (data: OfficeFormValues) => {
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/offices/${officeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          latitude: data.latitude && data.latitude.trim() !== '' ? Number(data.latitude) : null,
          longitude: data.longitude && data.longitude.trim() !== '' ? Number(data.longitude) : null,
        }),
      });
      
      const result = await res.json();
      
      if (result.success) {
        window.location.href = '/super-admin/offices';
      } else {
        setError(result.message || 'Failed to update office');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setValue('latitude', String(position.coords.latitude));
          setValue('longitude', String(position.coords.longitude));
        },
        (error) => {
          alert('Location permission denied or unavailable. Please enter coordinates manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
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
        <Link href="/super-admin/offices">
          <button className="w-12 h-12 mr-4 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-full transition-all text-muted-foreground hover:text-foreground shrink-0 border-0">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Edit Office</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold">Update the branch information.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 px-4 sm:px-6 lg:px-8">
        
        {/* Left Column: Context Graphic */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-10 text-center border-0 flex flex-col items-center justify-center min-h-[400px]">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-8">Service Location</p>
            
            <div className="w-32 h-32 rounded-[2rem] bg-background shadow-neu-inset flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 bg-primary/10 rounded-[2rem] blur-xl" />
              <MapPin size={48} className="text-primary relative z-10" />
            </div>
            
            <h2 className="text-xl font-black text-foreground tracking-tight mb-4">Update Branch</h2>
            <p className="text-sm font-semibold text-muted-foreground leading-relaxed max-w-xs">
              Make changes to the physical location, assignment, or metadata. Be sure coordinates are accurate for citizens.
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
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Office Name *</label>
                  <div className="relative">
                    <TextCursorInput size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                    <input
                      {...register('name')}
                      placeholder="e.g. RMC Main Branch"
                      className="w-full h-14 pl-14 pr-5 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground/50 border-0 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  {errors.name && <p className="text-[10px] font-bold text-red-500 ml-4 mt-1">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Office Code *</label>
                  <div className="relative">
                    <HashIcon size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                    <input
                      {...register('code')}
                      placeholder="e.g. RMC-01"
                      className="w-full h-14 pl-14 pr-5 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground/50 border-0 focus:ring-2 focus:ring-primary/20 outline-none transition-all uppercase"
                    />
                  </div>
                  {errors.code && <p className="text-[10px] font-bold text-red-500 ml-4 mt-1">{errors.code.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Assign Organization *</label>
                <div className="relative">
                  <Building2 size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary pointer-events-none z-10" />
                  <Select value={watch('organizationId') || ""} onValueChange={(val: string | null) => { if (val) setValue('organizationId', val); }}>
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

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Address *</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                  <input
                    {...register('address')}
                    placeholder="Full street address"
                    className="w-full h-14 pl-14 pr-5 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground/50 border-0 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                {errors.address && <p className="text-[10px] font-bold text-red-500 ml-4 mt-1">{errors.address.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">City *</label>
                  <div className="relative">
                    <Building size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                    <input
                      {...register('city')}
                      placeholder="e.g. Rajkot"
                      className="w-full h-14 pl-14 pr-5 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground/50 border-0 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  {errors.city && <p className="text-[10px] font-bold text-red-500 ml-4 mt-1">{errors.city.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">State *</label>
                  <div className="relative">
                    <Map size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary pointer-events-none z-10" />
                    <Select value={watch('state') || ""} onValueChange={(val: string | null) => { if (val) setValue('state', val); }}>
                      <SelectTrigger className="w-full !h-14 pl-14 pr-5 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground border-0 focus:ring-0 focus:ring-offset-0 focus:outline-none focus:bg-background/80 transition-all">
                        <SelectValue placeholder="Select state">
                          {watch('state') || "Select state"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-background shadow-neu border-0 rounded-2xl p-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"].map(state => (
                          <SelectItem key={state} value={state} className="focus:bg-primary/10 focus:text-primary rounded-xl font-bold cursor-pointer transition-colors py-3">{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.state && <p className="text-[10px] font-bold text-red-500 ml-4 mt-1">{errors.state.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Pincode *</label>
                  <div className="relative">
                    <Hash size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                    <input
                      {...register('pincode')}
                      placeholder="e.g. 360001"
                      className="w-full h-14 pl-14 pr-5 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground/50 border-0 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  {errors.pincode && <p className="text-[10px] font-bold text-red-500 ml-4 mt-1">{errors.pincode.message}</p>}
                </div>
              </div>

              <div className="pt-6">
                <div className="p-6 rounded-[2rem] bg-background shadow-neu-inset border-0 relative">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-sm font-black text-foreground tracking-tight">Geo-coordinates</h3>
                      <p className="text-xs font-semibold text-muted-foreground mt-1">Used to calculate distance for citizens.</p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      className="h-10 px-4 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl text-[10px] uppercase font-black tracking-widest text-primary flex items-center justify-center transition-all border-0 shrink-0"
                    >
                      <LocateFixed size={14} className="mr-2" /> Detect Location
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Latitude</label>
                      <div className="relative">
                        <Globe size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/50 pointer-events-none" />
                        <input
                          {...register('latitude')}
                          placeholder="e.g. 22.3039"
                          className="w-full h-14 pl-14 pr-5 bg-background/50 shadow-neu-inset rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground/50 border-0 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                      {errors.latitude && <p className="text-[10px] font-bold text-red-500 ml-4 mt-1">{errors.latitude?.message as string}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Longitude</label>
                      <div className="relative">
                        <Globe size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/50 pointer-events-none" />
                        <input
                          {...register('longitude')}
                          placeholder="e.g. 70.8022"
                          className="w-full h-14 pl-14 pr-5 bg-background/50 shadow-neu-inset rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground/50 border-0 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                      {errors.longitude && <p className="text-[10px] font-bold text-red-500 ml-4 mt-1">{errors.longitude?.message as string}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 flex flex-col sm:flex-row items-center gap-4">
                <Link href="/super-admin/offices" className="w-full sm:w-auto">
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
                    <span className="flex items-center"><Save size={18} className="mr-3" /> Update Office</span>
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
