import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  code: string;
  type?: string;
  description?: string;
  logo?: string;
  contactNumber?: string;
  email?: string;
  address?: string;
  status: 'ACTIVE' | 'INACTIVE';
  settings?: {
    maxQueueSize?: number;
    noShowTimeout?: number;
    checkInBuffer?: number;
    smsEnabled?: boolean;
    emailEnabled?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    type: { type: String },
    description: { type: String },
    logo: { type: String },
    contactNumber: { type: String },
    email: { type: String },
    address: { type: String },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    settings: {
      maxQueueSize: { type: Number },
      noShowTimeout: { type: Number },
      checkInBuffer: { type: Number },
      smsEnabled: { type: Boolean },
      emailEnabled: { type: Boolean },
    }
  },
  {
    timestamps: true,
  }
);

export const Organization = mongoose.models.Organization || mongoose.model<IOrganization>('Organization', OrganizationSchema);
