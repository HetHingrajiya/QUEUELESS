export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/db';
import { Role } from '@/models/Role';
import { PermissionsClient } from './PermissionsClient';

export default async function PermissionsPage() {
  await dbConnect();
  
  // Ensure system roles exist before fetching them
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

  const roles = await Role.find({ isSystem: true }).sort({ createdAt: 1 });
  
  const formattedRoles = roles.map(r => {
    const rawMatrix = r.permissionMatrix ? Object.fromEntries(r.permissionMatrix) : {};
    const plainMatrix = JSON.parse(JSON.stringify(rawMatrix));
    
    return {
      _id: r._id.toString(),
      name: r.name,
      permissionMatrix: plainMatrix
    };
  });

  return (
    <PermissionsClient initialRoles={formattedRoles} />
  );
}
