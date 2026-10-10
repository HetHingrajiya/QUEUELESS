import Link from 'next/link';
import { Plus, Shield, AlignLeft, Building2, Users } from 'lucide-react';
import dbConnect from '@/lib/db';
import { Role } from '@/models/Role';
import { User } from '@/models/User';
import { RoleActions } from './RoleActions';
import { StatusBadge } from '@/components/common/StatusBadge';

export const dynamic = 'force-dynamic';

async function getRoles() {
  await dbConnect();
  
  // Ensure system roles exist
  const systemRoles = [
    { name: 'SUPER_ADMIN', description: 'Full system access across all organizations', isSystem: true },
    { name: 'ADMIN', description: 'Organization-level access', isSystem: true },
    { name: 'STAFF', description: 'Counter-level access', isSystem: true },
    { name: 'CITIZEN', description: 'Public user access', isSystem: true }
  ];

  for (const role of systemRoles) {
    await Role.updateOne(
      { name: role.name, isSystem: true },
      { $setOnInsert: role },
      { upsert: true }
    );
  }

  const roles = await Role.find().sort({ isSystem: -1, createdAt: -1 }).populate('organizationId');
  
  const rolesWithCount = await Promise.all(roles.map(async (role) => {
    const count = await User.countDocuments({ role: role.name });
    return {
      _id: role._id.toString(),
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      organizationName: role.organizationId ? (role.organizationId as any).name : '-',
      userCount: count,
      permissionsCount: role.permissions?.length || 0
    };
  }));

  return rolesWithCount;
}

export default async function RolesPage() {
  const roles = await getRoles();

  return (
    <div className="space-y-6 lg:space-y-8 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Role Management</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold mt-1">Define access roles and view assignments.</p>
        </div>
        
        <Link href="/super-admin/roles/add">
          <button className="h-12 px-6 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl text-xs uppercase font-black tracking-widest text-primary flex items-center justify-center transition-all border-0">
            <Plus size={18} className="mr-2" /> Add Role
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
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Role Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Description</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Type</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Organization</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Users Assigned</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role: any) => (
                  <tr key={role._id} className="group hover:bg-primary/5 transition-colors">
                    <td className="px-6 py-5 border-b border-primary/5 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-background shadow-neu-inset flex items-center justify-center text-primary shrink-0">
                          <Shield size={16} />
                        </div>
                        <span className="font-black text-sm text-foreground whitespace-nowrap">{role.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 border-b border-primary/5 transition-all font-semibold text-muted-foreground text-sm max-w-[200px] truncate">
                      <div className="flex items-center gap-2">
                        <AlignLeft size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate">{role.description || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 border-b border-primary/5 transition-all">
                      {!role.isSystem ? (
                        <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-background shadow-neu-inset text-amber-500 whitespace-nowrap">
                          CUSTOM
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-background shadow-neu-inset text-blue-500 whitespace-nowrap">
                          SYSTEM
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 border-b border-primary/5 transition-all font-semibold text-muted-foreground text-sm">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-indigo-400" />
                        <span className="truncate max-w-[150px]">{role.organizationName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 border-b border-primary/5 transition-all font-semibold text-muted-foreground text-sm">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-emerald-400" />
                        {role.userCount} users
                      </div>
                    </td>
                    <td className="px-6 py-5 border-b border-primary/5 transition-all text-right">
                      <RoleActions roleId={role._id} isSystem={role.isSystem} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {roles.length === 0 && (
              <div className="mt-8 bg-background shadow-neu-inset rounded-[2rem] p-12 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-background shadow-neu rounded-full flex items-center justify-center text-muted-foreground mb-6">
                  <Shield size={32} />
                </div>
                <h3 className="text-xl font-black text-foreground mb-2">No roles found</h3>
                <p className="text-sm font-semibold text-muted-foreground">Access roles will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden px-4 sm:px-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
          {roles.map((role: any) => (
            <div key={role._id} className="bg-background shadow-neu rounded-3xl p-5 flex flex-col gap-4 border border-primary/5 relative overflow-hidden w-full">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-background shadow-neu-inset flex items-center justify-center text-primary shrink-0">
                    <Shield size={16} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-[13px] text-foreground truncate">{role.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-bold text-muted-foreground truncate">
                      <AlignLeft size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">{role.description || '-'}</span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 scale-75 origin-top-right">
                   {!role.isSystem ? (
                        <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-background shadow-neu-inset text-amber-500 whitespace-nowrap">
                          CUSTOM
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-background shadow-neu-inset text-blue-500 whitespace-nowrap">
                          SYSTEM
                        </span>
                      )}
                </div>
              </div>

              <div className="h-px w-full bg-primary/5"></div>

              <div className="flex flex-col gap-2 min-w-0">
                <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                  <Building2 size={12} className="text-indigo-400 shrink-0" />
                  <span className="truncate">{role.organizationName}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                  <Users size={12} className="text-emerald-400 shrink-0" />
                  <span className="truncate">{role.userCount} users</span>
                </div>
              </div>

              <div className="h-px w-full bg-primary/5"></div>

              <div className="flex justify-end">
                <RoleActions roleId={role._id} isSystem={role.isSystem} />
              </div>
            </div>
          ))}

          {roles.length === 0 && (
            <div className="col-span-1 md:col-span-2 mt-4 bg-background shadow-neu-inset rounded-[2rem] p-10 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-background shadow-neu rounded-full flex items-center justify-center text-muted-foreground mb-4">
                <Shield size={24} />
              </div>
              <h3 className="text-lg font-black text-foreground mb-1">No roles found</h3>
              <p className="text-xs font-semibold text-muted-foreground">Access roles will appear here.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
