import Link from 'next/link';
import { Plus, ListTree, AlignLeft, Building2, TrendingUp, Filter } from 'lucide-react';
import dbConnect from '@/lib/db';
import { PriorityRule } from '@/models/PriorityRule';
import { PriorityRuleActions } from './PriorityRuleActions';
import { StatusBadge } from '@/components/common/StatusBadge';

export const dynamic = 'force-dynamic';

async function getRules() {
  await dbConnect();
  const rules = await PriorityRule.find().populate('organizationId').populate('officeId').sort({ createdAt: -1 });
  return rules;
}

export default async function PriorityRulesPage() {
  const rules = await getRules();

  return (
    <div className="space-y-6 lg:space-y-8 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Priority Rules</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold mt-1">Configure dynamic priority multipliers.</p>
        </div>
        
        <Link href="/super-admin/priority-rules/add">
          <button className="h-12 px-6 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl text-xs uppercase font-black tracking-widest text-primary flex items-center justify-center transition-all border-0">
            <Plus size={18} className="mr-2" /> Add Rule
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
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Rule Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Description</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Multiplier</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Organization</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule: any) => (
                  <tr key={rule._id.toString()} className="group hover:bg-primary/5 transition-colors">
                    <td className="px-6 py-5 border-b border-primary/5 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-background shadow-neu-inset flex items-center justify-center text-primary shrink-0">
                          <Filter size={16} />
                        </div>
                        <span className="font-black text-sm text-foreground whitespace-nowrap">{rule.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 border-b border-primary/5 transition-all font-semibold text-muted-foreground text-sm max-w-[200px] truncate">
                      <div className="flex items-center gap-2">
                        <AlignLeft size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate">{rule.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 border-b border-primary/5 transition-all">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-blue-500 shrink-0" />
                        <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-background shadow-neu-inset text-blue-500 whitespace-nowrap">
                          {rule.priorityMultiplier.toFixed(1)}x
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 border-b border-primary/5 transition-all font-semibold text-muted-foreground text-sm">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Building2 size={14} className="text-indigo-400" />
                          <span className="truncate max-w-[150px]">{rule.organizationId ? rule.organizationId.name : '-'}</span>
                        </div>
                        {rule.officeId && (
                          <div className="text-[10px] text-muted-foreground pl-6 truncate max-w-[150px]">
                            {rule.officeId.name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 border-b border-primary/5 transition-all">
                      <StatusBadge status={rule.status || 'UNKNOWN'} />
                    </td>
                    <td className="px-6 py-5 border-b border-primary/5 transition-all text-right">
                      <PriorityRuleActions ruleId={rule._id.toString()} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {rules.length === 0 && (
              <div className="mt-8 bg-background shadow-neu-inset rounded-[2rem] p-12 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-background shadow-neu rounded-full flex items-center justify-center text-muted-foreground mb-6">
                  <ListTree size={32} />
                </div>
                <h3 className="text-xl font-black text-foreground mb-2">No priority rules found</h3>
                <p className="text-sm font-semibold text-muted-foreground">Priority algorithms will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden px-4 sm:px-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
          {rules.map((rule: any) => (
            <div key={rule._id.toString()} className="bg-background shadow-neu rounded-3xl p-5 flex flex-col gap-4 border border-primary/5 relative overflow-hidden w-full">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-background shadow-neu-inset flex items-center justify-center text-primary shrink-0">
                    <Filter size={16} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-[13px] text-foreground truncate">{rule.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-bold text-muted-foreground truncate">
                      <AlignLeft size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">{rule.description}</span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 scale-75 origin-top-right">
                  <StatusBadge status={rule.status || 'UNKNOWN'} />
                </div>
              </div>

              <div className="h-px w-full bg-primary/5"></div>

              <div className="flex flex-col gap-2 min-w-0">
                <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                  <TrendingUp size={12} className="text-blue-500 shrink-0" />
                  <span className="truncate text-blue-500 font-black">{rule.priorityMultiplier.toFixed(1)}x Multiplier</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                  <Building2 size={12} className="text-indigo-400 shrink-0" />
                  <span className="truncate">{rule.organizationId ? rule.organizationId.name : '-'}</span>
                </div>
              </div>

              <div className="h-px w-full bg-primary/5"></div>

              <div className="flex justify-end">
                <PriorityRuleActions ruleId={rule._id.toString()} />
              </div>
            </div>
          ))}

          {rules.length === 0 && (
            <div className="col-span-1 md:col-span-2 mt-4 bg-background shadow-neu-inset rounded-[2rem] p-10 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-background shadow-neu rounded-full flex items-center justify-center text-muted-foreground mb-4">
                <ListTree size={24} />
              </div>
              <h3 className="text-lg font-black text-foreground mb-1">No priority rules found</h3>
              <p className="text-xs font-semibold text-muted-foreground">Priority algorithms will appear here.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
