import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

export default function RolesPage() {
  const roles = [
    { id: 1, name: 'SUPER_ADMIN', desc: 'Full system access across all organizations', users: 2, custom: false },
    { id: 2, name: 'ADMIN', desc: 'Organization-level access', users: 15, custom: false },
    { id: 3, name: 'STAFF', desc: 'Counter-level access', users: 124, custom: false },
    { id: 4, name: 'MANAGER', desc: 'Custom role for branch managers', users: 8, custom: true },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Role Management</h2>
          <p className="text-sm text-slate-500">Define access roles and view assignments.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus size={18} className="mr-2" />
          Create Custom Role
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4">Role Name</th>
                  <th scope="col" className="px-6 py-4">Description</th>
                  <th scope="col" className="px-6 py-4">Type</th>
                  <th scope="col" className="px-6 py-4">Users Assigned</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900">{role.name}</td>
                    <td className="px-6 py-4">{role.desc}</td>
                    <td className="px-6 py-4">
                      {role.custom ? (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">CUSTOM</span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">SYSTEM</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{role.users} users</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Edit">
                          <Edit size={14} className="text-slate-600" />
                        </Button>
                        {role.custom && (
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" title="Delete">
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
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
