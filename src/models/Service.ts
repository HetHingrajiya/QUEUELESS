import mongoose, { Schema, Document } from 'mongoose';

export interface IService extends Document {
  name: string;
  code: string;
  description?: string;
  organizationId: mongoose.Types.ObjectId;
  officeId: mongoose.Types.ObjectId;
  averageServiceTime: number; // in minutes
  dailyTokenLimit?: number;
  priorityEnabled: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true },
    description: { type: String },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    officeId: { type: Schema.Types.ObjectId, ref: 'Office', required: true, index: true },
    averageServiceTime: { type: Number, default: 5 },
    dailyTokenLimit: { type: Number },
    priorityEnabled: { type: Boolean, default: false },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  {
    timestamps: true,
  }
);

ServiceSchema.index({ code: 1, officeId: 1 }, { unique: true });

export const Service = mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema);
