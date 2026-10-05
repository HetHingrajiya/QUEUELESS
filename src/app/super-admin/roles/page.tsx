export const dynamic = 'force-dynamic';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import dbConnect from '@/lib/db';
import { Role } from '@/models/Role';
import { User } from '@/models/User';
import { RoleActions } from './RoleActions';

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
    // Assuming User model has a `role` string field that matches the Role name
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
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Role Management</h2>
          <p className="text-sm text-slate-500">Define access roles and view assignments.</p>
        </div>
        <Link href="/super-admin/roles/add">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus size={18} className="mr-2" />
            Create Custom Role
          </Button>
        </Link>
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
                  <th scope="col" className="px-6 py-4">Organization</th>
                  <th scope="col" className="px-6 py-4">Users Assigned</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role._id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900">{role.name}</td>
                    <td className="px-6 py-4">{role.description}</td>
                    <td className="px-6 py-4">
                      {!role.isSystem ? (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">CUSTOM</span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">SYSTEM</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{role.organizationName}</td>
                    <td className="px-6 py-4">{role.userCount} users</td>
                    <td className="px-6 py-4 text-right">
                      <RoleActions roleId={role._id} isSystem={role.isSystem} />
                    </td>
                  </tr>
                ))}
                
                {roles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No roles found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
