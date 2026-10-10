import Link from 'next/link';
import { Plus, LayoutTemplate, Clock, Code2 } from 'lucide-react';
import dbConnect from '@/lib/db';
import { Service } from '@/models/Service';
import { ServiceActions } from './ServiceActions';
import { StatusBadge } from '@/components/common/StatusBadge';

export const dynamic = 'force-dynamic';

async function getServices() {
  await dbConnect();
  const services = await Service.find({}).populate('organizationId').populate('officeId').sort({ createdAt: -1 });
  return services;
}

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <div className="space-y-6 lg:space-y-8 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Services</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold mt-1">Manage all government services.</p>
        </div>
        
        <Link href="/super-admin/services/add">
          <button className="h-12 px-6 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl text-xs uppercase font-black tracking-widest text-primary flex items-center justify-center transition-all border-0">
            <Plus size={18} className="mr-2" /> Add Service
          </button>
        </Link>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block px-4 sm:px-6 lg:px-8">
        <div className="bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0">
          <div className="w-full overflow-x-auto custom-scrollbar pb-4">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Service Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Code</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Avg. Time</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service: any) => (
                  <tr key={service._id.toString()} className="group hover:bg-primary/5 transition-colors">
                    <td className="px-6 py-5 border-b border-primary/5 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-background shadow-neu-inset flex items-center justify-center text-primary shrink-0">
                          <LayoutTemplate size={16} />
                        </div>
                        <span className="font-black text-sm text-foreground whitespace-nowrap">{service.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 border-b border-primary/5 transition-all font-semibold text-muted-foreground text-sm">
                      <div className="flex items-center gap-2">
                        <Code2 size={14} className="text-indigo-400" />
                        {service.code || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-5 border-b border-primary/5 transition-all font-semibold text-muted-foreground text-sm">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-amber-400" />
                        {service.averageServiceTime} mins
                      </div>
                    </td>
                    <td className="px-6 py-5 border-b border-primary/5 transition-all">
                      <StatusBadge status={service.status || 'UNKNOWN'} />
                    </td>
                    <td className="px-6 py-5 border-b border-primary/5 transition-all text-right">
                      <ServiceActions serviceId={service._id.toString()} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {services.length === 0 && (
              <div className="mt-8 bg-background shadow-neu-inset rounded-[2rem] p-12 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-background shadow-neu rounded-full flex items-center justify-center text-muted-foreground mb-6">
                  <LayoutTemplate size={32} />
                </div>
                <h3 className="text-xl font-black text-foreground mb-2">No services found</h3>
                <p className="text-sm font-semibold text-muted-foreground">Government services will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden px-4 sm:px-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
          {services.map((service: any) => (
            <div key={service._id.toString()} className="bg-background shadow-neu rounded-3xl p-5 flex flex-col gap-4 border border-primary/5 relative overflow-hidden w-full">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-background shadow-neu-inset flex items-center justify-center text-primary shrink-0">
                    <LayoutTemplate size={16} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-[13px] text-foreground truncate">{service.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-bold text-muted-foreground truncate">
                      <Code2 size={12} className="text-indigo-400 shrink-0" />
                      <span className="truncate">{service.code || '-'}</span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 scale-75 origin-top-right">
                  <StatusBadge status={service.status || 'UNKNOWN'} />
                </div>
              </div>

              <div className="h-px w-full bg-primary/5"></div>

              <div className="flex flex-col gap-2 min-w-0">
                <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                  <Clock size={12} className="text-amber-400 shrink-0" />
                  <span className="truncate">{service.averageServiceTime} mins avg. time</span>
                </div>
              </div>

              <div className="h-px w-full bg-primary/5"></div>

              <div className="flex justify-end">
                <ServiceActions serviceId={service._id.toString()} />
              </div>
            </div>
          ))}

          {services.length === 0 && (
            <div className="col-span-1 md:col-span-2 mt-4 bg-background shadow-neu-inset rounded-[2rem] p-10 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-background shadow-neu rounded-full flex items-center justify-center text-muted-foreground mb-4">
                <LayoutTemplate size={24} />
              </div>
              <h3 className="text-lg font-black text-foreground mb-1">No services found</h3>
              <p className="text-xs font-semibold text-muted-foreground">Government services will appear here.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
