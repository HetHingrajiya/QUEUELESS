import mongoose, { Schema, Document } from 'mongoose';

// CRUD permission set for a single module
export interface ICrudPermission {
  view: boolean;
  add: boolean;
  modify: boolean;
  delete: boolean;
}

// Map of module name → CRUD permissions
export type IPermissionMatrix = Record<string, ICrudPermission>;

export interface IRole extends Document {
  name: string;
  description?: string;
  isSystem: boolean;
  // Legacy flat list kept for backward compatibility
  permissions: string[];
  // New CRUD matrix: { offices: { view: true, add: true, modify: false, delete: false }, ... }
  permissionMatrix: IPermissionMatrix;
  organizationId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// All modules that can be permission-controlled
export const PERMISSION_MODULES = [
  'organizations',
  'offices',
  'services',
  'counters',
  'staff',
  'queue',
  'tokens',
  'priorityRules',
  'workingHours',
  'holidays',
  'analytics',
  'reports',
  'notifications',
  'auditLogs',
  'settings',
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];
export type PermissionAction = 'view' | 'add' | 'modify' | 'delete';

// Default CRUD for a module (all false)
export const emptyModulePermission = (): ICrudPermission => ({
  view: false,
  add: false,
  modify: false,
  delete: false,
});

// Sensible defaults per role
export const DEFAULT_PERMISSION_MATRIX: Record<string, IPermissionMatrix> = {
  SUPER_ADMIN: Object.fromEntries(
    PERMISSION_MODULES.map(m => [m, { view: true, add: true, modify: true, delete: true }])
  ),
  ADMIN: {
    organizations: { view: true, add: false, modify: false, delete: false },
    offices: { view: true, add: true, modify: true, delete: false },
    services: { view: true, add: true, modify: true, delete: false },
    counters: { view: true, add: true, modify: true, delete: false },
    staff: { view: true, add: true, modify: true, delete: false },
    queue: { view: true, add: true, modify: true, delete: false },
    tokens: { view: true, add: true, modify: true, delete: false },
    priorityRules: { view: true, add: true, modify: true, delete: false },
    workingHours: { view: true, add: true, modify: true, delete: false },
    holidays: { view: true, add: true, modify: true, delete: false },
    analytics: { view: true, add: false, modify: false, delete: false },
    reports: { view: true, add: true, modify: false, delete: true },
    notifications: { view: true, add: true, modify: false, delete: false },
    auditLogs: { view: true, add: false, modify: false, delete: false },
    settings: { view: true, add: false, modify: true, delete: false },
  },
  STAFF: {
    organizations: { view: false, add: false, modify: false, delete: false },
    offices: { view: true, add: false, modify: false, delete: false },
    services: { view: true, add: false, modify: false, delete: false },
    counters: { view: true, add: false, modify: false, delete: false },
    staff: { view: false, add: false, modify: false, delete: false },
    queue: { view: true, add: false, modify: true, delete: false },
    tokens: { view: true, add: false, modify: true, delete: false },
    priorityRules: { view: false, add: false, modify: false, delete: false },
    workingHours: { view: true, add: false, modify: false, delete: false },
    holidays: { view: true, add: false, modify: false, delete: false },
    analytics: { view: false, add: false, modify: false, delete: false },
    reports: { view: false, add: false, modify: false, delete: false },
    notifications: { view: true, add: false, modify: false, delete: false },
    auditLogs: { view: false, add: false, modify: false, delete: false },
    settings: { view: false, add: false, modify: false, delete: false },
  },
  CITIZEN: Object.fromEntries(
    PERMISSION_MODULES.map(m => [m, { view: false, add: false, modify: false, delete: false }])
  ),
};

const CrudPermissionSchema = new Schema(
  {
    view: { type: Boolean, default: false },
    add: { type: Boolean, default: false },
    modify: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
  },
  { _id: false }
);

const RoleSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    isSystem: { type: Boolean, default: false },
    permissions: [{ type: String }], // legacy
    permissionMatrix: {
      type: Map,
      of: CrudPermissionSchema,
      default: {},
    },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
  },
  {
    timestamps: true,
  }
);

// Ensure role names are unique per organization (or globally if system role)
RoleSchema.index({ name: 1, organizationId: 1 }, { unique: true });

export const Role = mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);
