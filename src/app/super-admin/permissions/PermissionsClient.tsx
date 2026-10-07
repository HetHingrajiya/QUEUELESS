"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
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

  // SUPER_ADMIN always has all permissions, CITIZEN typically has none of these backend ones
  const filteredRoles = roles.filter(r => r.name !== 'SUPER_ADMIN' && r.name !== 'CITIZEN');

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Permissions Matrix</h2>
          <p className="text-sm text-slate-500">Configure access levels for each system role.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
          Save Changes
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4">Permission</th>
                  <th scope="col" className="px-6 py-4 text-center">SUPER_ADMIN (Default)</th>
                  {filteredRoles.map(role => (
                    <th key={role._id} scope="col" className="px-6 py-4 text-center">{role.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AVAILABLE_PERMISSIONS.map((perm) => (
                  <tr key={perm.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{perm.name}</td>
                    <td className="px-6 py-4 text-center">
                      <Switch checked={true} disabled />
                    </td>
                    {filteredRoles.map(role => (
                      <td key={role._id} className="px-6 py-4 text-center">
                        <Switch 
                          checked={(role.permissions || []).includes(perm.id)} 
                          onCheckedChange={(checked) => handleToggle(role._id, perm.id, checked)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
