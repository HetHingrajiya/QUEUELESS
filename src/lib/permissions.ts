import { Role } from '@/models/Role';
import { User } from '@/models/User';
import mongoose from 'mongoose';

export const PERMISSIONS = {
  MANAGE_ORGANIZATIONS: 'MANAGE_ORGANIZATIONS',
  MANAGE_OFFICES: 'MANAGE_OFFICES',
  MANAGE_SERVICES: 'MANAGE_SERVICES',
  MANAGE_STAFF: 'MANAGE_STAFF',
  MANAGE_QUEUE: 'MANAGE_QUEUE',
  VIEW_ANALYTICS: 'VIEW_ANALYTICS',
  MANAGE_SETTINGS: 'MANAGE_SETTINGS',
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export async function hasPermission(userId: string | mongoose.Types.ObjectId | undefined | null, permission: Permission): Promise<boolean> {
  if (!userId) return false;
  
  if (!mongoose.Types.ObjectId.isValid(userId.toString())) return false;

  const user = await User.findById(userId).populate('roleId').lean();
  
  if (!user) return false;
  
  if (user.role === 'SUPER_ADMIN') return true;
  if (user.role === 'CITIZEN') return false;

  if (user.role === 'ADMIN' || user.role === 'STAFF') {
    if (!user.roleId) return false;
    
    // roleId could be populated
    if (typeof user.roleId === 'object' && 'permissions' in user.roleId) {
      return (user.roleId as any).permissions.includes(permission);
    }
    
    // if not populated, fetch it
    const role = await Role.findById(user.roleId).lean();
    if (!role) return false;
    return role.permissions.includes(permission);
  }

  return false;
}

export async function requirePermission(userId: string | mongoose.Types.ObjectId | undefined | null, permission: Permission): Promise<void> {
  const hasAccess = await hasPermission(userId, permission);
  if (!hasAccess) {
    throw new Error(`Unauthorized: Missing permission ${permission}`);
  }
}

export async function getUserPermissions(userId: string | mongoose.Types.ObjectId | undefined | null): Promise<string[]> {
  if (!userId) return [];
  if (!mongoose.Types.ObjectId.isValid(userId.toString())) return [];

  const user = await User.findById(userId).populate('roleId').lean();
  
  if (!user) return [];
  if (user.role === 'SUPER_ADMIN') return ALL_PERMISSIONS;
  if (user.role === 'CITIZEN') return [];
  if (!user.roleId) return [];

  if (typeof user.roleId === 'object' && 'permissions' in user.roleId) {
    return (user.roleId as any).permissions;
  }
  
  const role = await Role.findById(user.roleId).lean();
  if (!role) return [];
  
  return role.permissions;
}
