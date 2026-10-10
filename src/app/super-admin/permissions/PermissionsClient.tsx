"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Loader2, Key } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';

const AVAILABLE_PERMISSIONS = [
  { id: 'MANAGE_ORGANIZATIONS', name: 'Manage Organizations' },
  { id: 'MANAGE_OFFICES', name: 'Manage Offices' },
  { id: 'MANAGE_SERVICES', name: 'Manage Services' },
  { id: 'MANAGE_STAFF', name: 'Manage Staff' },
  { id: 'MANAGE_QUEUE', name: 'Manage Queue' },
  { id: 'VIEW_ANALYTICS', name: 'View Analytics' },
  { id: 'MANAGE_SETTINGS', name: 'Manage Settings' },
];

export function PermissionsClient({ initialRoles }: { initialRoles: any[] }) {
  const router = useRouter();
  const [roles, setRoles] = useState(initialRoles);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (roleId: string, permissionId: string, checked: boolean) => {
    setRoles(prevRoles => prevRoles.map(role => {
      if (role._id === roleId) {
        const newPermissions = checked 
          ? [...(role.permissions || []), permissionId]
          : (role.permissions || []).filter((p: string) => p !== permissionId);
        return { ...role, permissions: newPermissions };
      }
      return role;
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = roles.map(r => ({
        roleId: r._id,
        roleName: r.name,
        permissions: r.permissions || []
      }));

      const res = await fetch('/api/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rolePermissions: payload }),
      });

      const data = await res.json();
      if (data.success) {
        alert('Permissions updated successfully!');
        window.location.reload();
      } else {
        alert(data.message || 'Failed to update permissions');
      }
    } catch (err) {
      alert('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredRoles = roles.filter(r => r.name !== 'SUPER_ADMIN' && r.name !== 'CITIZEN');

  return (
    <div className="space-y-6 lg:space-y-8 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Permissions Matrix</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold mt-1">Configure access levels for each system role.</p>
        </div>
        
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="h-12 px-6 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl text-xs uppercase font-black tracking-widest text-primary flex items-center justify-center transition-all border-0 disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Save size={18} className="mr-2" />} 
          Save Changes
        </button>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0">
          <div className="w-full overflow-x-auto custom-scrollbar pb-4">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Permission</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 text-center whitespace-nowrap">SUPER_ADMIN (Default)</th>
                  {filteredRoles.map(role => (
                    <th key={role._id} className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 text-center whitespace-nowrap">
                      {role.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AVAILABLE_PERMISSIONS.map((perm) => (
                  <tr key={perm.id} className="group hover:bg-primary/5 transition-colors">
                    <td className="px-6 py-5 border-b border-primary/5 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-background shadow-neu-inset flex items-center justify-center text-primary shrink-0">
                          <Key size={16} />
                        </div>
                        <span className="font-black text-sm text-foreground whitespace-nowrap">{perm.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 border-b border-primary/5 transition-all text-center">
                      <div className="inline-flex items-center justify-center">
                         <div className="w-12 h-6 bg-primary rounded-full relative shadow-neu-inset opacity-50 cursor-not-allowed">
                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md"></div>
                         </div>
                      </div>
                    </td>
                    {filteredRoles.map(role => {
                      const isChecked = (role.permissions || []).includes(perm.id);
                      return (
                        <td key={role._id} className="px-6 py-5 border-b border-primary/5 transition-all text-center">
                          <div className="inline-flex items-center justify-center cursor-pointer group" onClick={() => handleToggle(role._id, perm.id, !isChecked)}>
                            <div className={`w-12 h-6 rounded-full relative transition-all ${isChecked ? 'bg-primary shadow-neu' : 'bg-background shadow-neu-inset'}`}>
                              <div className={`absolute top-1 w-4 h-4 rounded-full shadow-md transition-all ${isChecked ? 'right-1 bg-white' : 'left-1 bg-muted-foreground/30'}`}></div>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
    </div>
  );
}
