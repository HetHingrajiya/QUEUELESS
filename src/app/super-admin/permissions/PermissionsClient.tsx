"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Loader2, Shield } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';

const PERMISSION_MODULES = [
  { id: 'organizations', name: 'Organizations' },
  { id: 'offices', name: 'Offices' },
  { id: 'services', name: 'Services' },
  { id: 'counters', name: 'Counters' },
  { id: 'staff', name: 'Staff' },
  { id: 'queue', name: 'Queue' },
  { id: 'tokens', name: 'Tokens' },
  { id: 'priorityRules', name: 'Priority Rules' },
  { id: 'workingHours', name: 'Working Hours' },
  { id: 'holidays', name: 'Holidays' },
  { id: 'analytics', name: 'Analytics' },
  { id: 'reports', name: 'Reports' },
  { id: 'notifications', name: 'Notifications' },
  { id: 'auditLogs', name: 'Audit Logs' },
  { id: 'settings', name: 'Settings' },
];

export function PermissionsClient({ initialRoles }: { initialRoles: any[] }) {
  const router = useRouter();
  // Filter out SUPER_ADMIN as it's implicit and shouldn't be editable here
  const editableRoles = initialRoles.filter(r => r.name !== 'SUPER_ADMIN');
  const [roles, setRoles] = useState(editableRoles);
  const [selectedRoleId, setSelectedRoleId] = useState(editableRoles[0]?._id);
  const [isSaving, setIsSaving] = useState(false);

  const selectedRole = roles.find(r => r._id === selectedRoleId);

  const handleToggle = (moduleId: string, action: 'view' | 'add' | 'modify' | 'delete', checked: boolean) => {
    if (!selectedRole) return;

    setRoles(prevRoles => prevRoles.map(role => {
      if (role._id === selectedRoleId) {
        const matrix = { ...(role.permissionMatrix || {}) };
        if (!matrix[moduleId]) {
          matrix[moduleId] = { view: false, add: false, modify: false, delete: false };
        }
        
        matrix[moduleId][action] = checked;

        // Dependency logic: if add/modify/delete is checked, view must be checked
        if (checked && (action === 'add' || action === 'modify' || action === 'delete')) {
          matrix[moduleId].view = true;
        }

        // Reverse dependency: if view is unchecked, uncheck everything else
        if (!checked && action === 'view') {
          matrix[moduleId].add = false;
          matrix[moduleId].modify = false;
          matrix[moduleId].delete = false;
        }

        return { ...role, permissionMatrix: matrix };
      }
      return role;
    }));
  };

  const toggleAll = (action: 'view' | 'add' | 'modify' | 'delete', checked: boolean) => {
    if (!selectedRole) return;

    setRoles(prevRoles => prevRoles.map(role => {
      if (role._id === selectedRoleId) {
        const matrix = { ...(role.permissionMatrix || {}) };
        
        PERMISSION_MODULES.forEach(mod => {
          if (!matrix[mod.id]) {
            matrix[mod.id] = { view: false, add: false, modify: false, delete: false };
          }
          matrix[mod.id][action] = checked;

          if (checked && (action === 'add' || action === 'modify' || action === 'delete')) {
            matrix[mod.id].view = true;
          }
          if (!checked && action === 'view') {
            matrix[mod.id].add = false;
            matrix[mod.id].modify = false;
            matrix[mod.id].delete = false;
          }
        });

        return { ...role, permissionMatrix: matrix };
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
        permissionMatrix: r.permissionMatrix || {}
      }));

      const res = await fetch('/api/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rolePermissions: payload }),
      });

      const data = await res.json();
      if (data.success) {
        alert('Permissions updated successfully!');
        router.refresh();
      } else {
        alert(data.message || 'Failed to update permissions');
      }
    } catch (err) {
      alert('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Permissions Matrix</h2>
          <p className="text-sm text-slate-500">Configure CRUD access levels for each system role.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
          Save Changes
        </Button>
      </div>

      <div className="flex space-x-2 border-b border-slate-200">
        <button
          className="px-4 py-2 font-medium text-sm text-slate-400 cursor-not-allowed border-b-2 border-transparent"
          title="SUPER_ADMIN has all permissions implicitly"
        >
          SUPER_ADMIN
        </button>
        {roles.map(role => (
          <button
            key={role._id}
            onClick={() => setSelectedRoleId(role._id)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              selectedRoleId === role._id 
                ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {role.name}
          </button>
        ))}
      </div>

      {selectedRole && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-bold">Module</th>
                    <th scope="col" className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span>View</span>
                        <Switch 
                          checked={PERMISSION_MODULES.every(m => selectedRole.permissionMatrix?.[m.id]?.view)}
                          onCheckedChange={(c) => toggleAll('view', c)}
                        />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span>Add</span>
                        <Switch 
                          checked={PERMISSION_MODULES.every(m => selectedRole.permissionMatrix?.[m.id]?.add)}
                          onCheckedChange={(c) => toggleAll('add', c)}
                        />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span>Modify</span>
                        <Switch 
                          checked={PERMISSION_MODULES.every(m => selectedRole.permissionMatrix?.[m.id]?.modify)}
                          onCheckedChange={(c) => toggleAll('modify', c)}
                        />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-red-600">Delete</span>
                        <Switch 
                          checked={PERMISSION_MODULES.every(m => selectedRole.permissionMatrix?.[m.id]?.delete)}
                          onCheckedChange={(c) => toggleAll('delete', c)}
                        />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_MODULES.map((mod) => {
                    const matrix = selectedRole.permissionMatrix || {};
                    const perms = matrix[mod.id] || { view: false, add: false, modify: false, delete: false };

                    return (
                      <tr key={mod.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900">{mod.name}</td>
                        <td className="px-6 py-4 text-center">
                          <Switch 
                            checked={perms.view} 
                            onCheckedChange={(c) => handleToggle(mod.id, 'view', c)}
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Switch 
                            checked={perms.add} 
                            onCheckedChange={(c) => handleToggle(mod.id, 'add', c)}
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Switch 
                            checked={perms.modify} 
                            onCheckedChange={(c) => handleToggle(mod.id, 'modify', c)}
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Switch 
                            checked={perms.delete} 
                            onCheckedChange={(c) => handleToggle(mod.id, 'delete', c)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
