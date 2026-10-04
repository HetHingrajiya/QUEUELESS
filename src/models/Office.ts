import mongoose, { Schema, Document } from 'mongoose';

export interface IOffice extends Document {
  name: string;
  code: string;
  organizationId: mongoose.Types.ObjectId;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  contactNumber?: string;
  email?: string;
  openingTime?: string;
  closingTime?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const OfficeSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    contactNumber: { type: String },
    email: { type: String },
    openingTime: { type: String },
    closingTime: { type: String },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure office code is unique per organization
OfficeSchema.index({ code: 1, organizationId: 1 }, { unique: true });

export const Office = mongoose.models.Office || mongoose.model<IOffice>('Office', OfficeSchema);
