import { PermissionModule, PermissionAction, IPermissionMatrix, Role } from '@/models/Role';
import { getUserFromCookie } from './auth';
import dbConnect from './db';

export interface UserSession {
  userId: string;
  role: string;
  organizationId?: string;
  officeId?: string;
}

/**
 * Validates whether a given user session has a specific permission based on their role's matrix.
 * Note: SUPER_ADMIN always has all permissions.
 */
export function hasPermission(
  user: UserSession | null,
  roleMatrix: IPermissionMatrix | undefined | null,
  module: PermissionModule,
  action: PermissionAction
): boolean {
  if (!user) return false;
  
  // SUPER_ADMIN always has access to everything
  if (user.role === 'SUPER_ADMIN') return true;
  
  if (!roleMatrix) return false;
  
  const modulePerms = roleMatrix[module];
  if (!modulePerms) return false;
  
  return !!modulePerms[action];
}

/**
 * Server-side helper to require a permission.
 * Fetches the user session and role matrix, then checks the permission.
 * Returns the user session if permitted, or null if unauthorized.
 */
export async function requirePermission(
  module: PermissionModule,
  action: PermissionAction
): Promise<UserSession | null> {
  await dbConnect();
  const user = await getUserFromCookie();
  
  if (!user) return null;
  if (user.role === 'SUPER_ADMIN') return user;
  
  const roleRecord = await Role.findOne({ name: user.role, isSystem: true }).lean();
  if (!roleRecord || !roleRecord.permissionMatrix) return null;

  const matrix = roleRecord.permissionMatrix;
  
  if (hasPermission(user, matrix, module, action)) {
    return user;
  }
  
  return null;
}

export async function getUserMatrix(user: UserSession | null): Promise<IPermissionMatrix | null> {
  if (!user) return null;
  if (user.role === 'SUPER_ADMIN') {
    // Return a dummy matrix with true for everything since SUPER_ADMIN bypasses it anyway
    return {} as IPermissionMatrix;
  }
  
  await dbConnect();
  const roleRecord = await Role.findOne({ name: user.role, isSystem: true }).lean();
  if (!roleRecord || !roleRecord.permissionMatrix) return null;

  return roleRecord.permissionMatrix as IPermissionMatrix;
}

/**
 * Used for dependency logic in UI: if a user checks 'add', 'modify', or 'delete',
 * 'view' should automatically be checked.
 */
export function enforceMatrixDependencies(matrix: IPermissionMatrix): IPermissionMatrix {
  const newMatrix = { ...matrix };
  for (const mod in newMatrix) {
    const p = newMatrix[mod];
    if (p.add || p.modify || p.delete) {
      p.view = true;
    }
  }
  return newMatrix;
}
