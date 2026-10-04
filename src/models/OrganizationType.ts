import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganizationType extends Document {
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationTypeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

export const OrganizationType = mongoose.models.OrganizationType || mongoose.model<IOrganizationType>('OrganizationType', OrganizationTypeSchema);
