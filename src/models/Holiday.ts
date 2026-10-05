import mongoose, { Schema, Document } from 'mongoose';

export interface IHoliday extends Document {
  name: string;
  date: Date;
  organizationId: mongoose.Types.ObjectId;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HolidaySchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    date: { type: Date, required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    description: { type: String },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate holidays on the same date for the same organization
HolidaySchema.index({ date: 1, organizationId: 1 }, { unique: true });

export const Holiday = mongoose.models.Holiday || mongoose.model<IHoliday>('Holiday', HolidaySchema);
