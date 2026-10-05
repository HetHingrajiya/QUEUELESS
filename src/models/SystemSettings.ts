import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSettings extends Document {
  maxQueueSize: number;
  noShowTimeout: number;
  checkInBuffer: number;
  aiRefreshRate: number;
  sessionTimeout: number;
  passwordExpiry: number;
}

const SystemSettingsSchema: Schema = new Schema(
  {
    maxQueueSize: { type: Number, default: 100 },
    noShowTimeout: { type: Number, default: 5 },
    checkInBuffer: { type: Number, default: 15 },
    aiRefreshRate: { type: Number, default: 30 },
    sessionTimeout: { type: Number, default: 120 },
    passwordExpiry: { type: Number, default: 90 },
  },
  {
    timestamps: true,
  }
);

export const SystemSettings = mongoose.models.SystemSettings || mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);
