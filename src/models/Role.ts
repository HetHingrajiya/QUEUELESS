import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
  name: string;
  description?: string;
  isSystem: boolean;
  permissions: string[];
  organizationId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    isSystem: { type: Boolean, default: false },
    permissions: [{ type: String }],
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
  },
  {
    timestamps: true,
  }
);

// Ensure role names are unique per organization (or globally if system role)
RoleSchema.index({ name: 1, organizationId: 1 }, { unique: true });

export const Role = mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);
