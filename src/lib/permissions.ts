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

export class AuthorizationError extends Error {
  status: 401 | 403;
  constructor(message: string, status: 401 | 403 = 403) {
    super(message);
    this.name = 'AuthorizationError';
    this.status = status;
  }
}

export async function hasPermission(
  userId: string | mongoose.Types.ObjectId | undefined | null,
  permission: Permission,
): Promise<boolean> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId.toString())) return false;

  const user = await User.findById(userId).populate('roleId').lean();
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  if (user.role === 'CITIZEN') return false;
  if (user.role !== 'ADMIN' && user.role !== 'STAFF') return false;
  if (!user.roleId) return false;

  if (typeof user.roleId === 'object' && 'permissions' in user.roleId) {
    return Array.isArray((user.roleId as any).permissions)
      && (user.roleId as any).permissions.includes(permission);
  }

  const role = await Role.findById(user.roleId).lean();
  return !!role && Array.isArray(role.permissions) && role.permissions.includes(permission);
}

export async function requirePermission(
  userId: string | mongoose.Types.ObjectId | undefined | null,
  permission: Permission,
): Promise<void> {
  if (!userId) throw new AuthorizationError('Unauthorized', 401);
  if (!(await hasPermission(userId, permission))) {
    throw new AuthorizationError(`Forbidden: Missing ${permission} permission`, 403);
  }
}

export function assertPermissionValue(permission: unknown): asserts permission is Permission {
  if (typeof permission !== 'string' || !ALL_PERMISSIONS.includes(permission as Permission)) {
    throw new AuthorizationError('Invalid permission', 403);
  }
}

export async function getUserPermissions(
  userId: string | mongoose.Types.ObjectId | undefined | null,
): Promise<string[]> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId.toString())) return [];

  const user = await User.findById(userId).populate('roleId').lean();
  if (!user) return [];
  if (user.role === 'SUPER_ADMIN') return [...ALL_PERMISSIONS];
  if (user.role === 'CITIZEN' || !user.roleId) return [];

  if (typeof user.roleId === 'object' && 'permissions' in user.roleId) {
    return Array.isArray((user.roleId as any).permissions) ? (user.roleId as any).permissions : [];
  }

  const role = await Role.findById(user.roleId).lean();
  return role && Array.isArray(role.permissions) ? role.permissions : [];
}
