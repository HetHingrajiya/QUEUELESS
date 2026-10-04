import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function PermissionsPage() {
  const permissions = [
    { id: 1, name: 'Manage Organizations', superAdmin: true, admin: false, staff: false },
    { id: 2, name: 'Manage Offices', superAdmin: true, admin: true, staff: false },
    { id: 3, name: 'Manage Services', superAdmin: true, admin: true, staff: false },
    { id: 4, name: 'Manage Staff', superAdmin: true, admin: true, staff: false },
    { id: 5, name: 'Manage Queue', superAdmin: true, admin: true, staff: true },
    { id: 6, name: 'View Analytics', superAdmin: true, admin: true, staff: false },
    { id: 7, name: 'Manage Settings', superAdmin: true, admin: false, staff: false },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Permissions Matrix</h2>
          <p className="text-sm text-slate-500">Configure access levels for each system role.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Save size={16} className="mr-2" />
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
                  <th scope="col" className="px-6 py-4 text-center">SUPER_ADMIN</th>
                  <th scope="col" className="px-6 py-4 text-center">ADMIN</th>
                  <th scope="col" className="px-6 py-4 text-center">STAFF</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((perm) => (
                  <tr key={perm.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{perm.name}</td>
                    <td className="px-6 py-4 text-center">
                      <Switch defaultChecked={perm.superAdmin} disabled />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Switch defaultChecked={perm.admin} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Switch defaultChecked={perm.staff} />
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
