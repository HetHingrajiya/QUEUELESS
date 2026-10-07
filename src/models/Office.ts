import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkingHours {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
}

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
  openingTime?: string; // Legacy
  closingTime?: string; // Legacy
  workingHours?: IWorkingHours[];
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const WorkingHoursSchema = new Schema({
  day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: true },
  isOpen: { type: Boolean, default: true },
  openingTime: { type: String, default: '09:00' },
  closingTime: { type: String, default: '17:00' },
  breakStartTime: { type: String, default: '13:00' },
  breakEndTime: { type: String, default: '14:00' }
});

const OfficeSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    latitude: { type: Number, min: -90, max: 90, default: null },
    longitude: { type: Number, min: -180, max: 180, default: null },
    contactNumber: { type: String },
    email: { type: String },
    openingTime: { type: String },
    closingTime: { type: String },
    workingHours: [WorkingHoursSchema],
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure office code is unique per organization
OfficeSchema.index({ code: 1, organizationId: 1 }, { unique: true });

export const Office = mongoose.models.Office || mongoose.model<IOffice>('Office', OfficeSchema);
