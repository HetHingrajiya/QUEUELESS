import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSettings extends Document {
  maxQueueSize: number;
  noShowTimeout: number;
  checkInBuffer: number;
  aiRefreshRate: number;
  sessionTimeout: number;
  passwordExpiry: number;
  // Queue Algorithm Settings
  enableAIPrediction: boolean;
  historicalWeight: number;
  liveVelocityWeight: number;
  maxDailyTokensPerUser: number;
  // Notification Settings
  smsEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  notifyPeopleAhead: number;
  notifyMinutesAhead: number;
}

const SystemSettingsSchema: Schema = new Schema(
  {
    maxQueueSize: { type: Number, default: 100 },
    noShowTimeout: { type: Number, default: 5 },
    checkInBuffer: { type: Number, default: 15 },
    aiRefreshRate: { type: Number, default: 30 },
    sessionTimeout: { type: Number, default: 120 },
    passwordExpiry: { type: Number, default: 90 },
    enableAIPrediction: { type: Boolean, default: true },
    historicalWeight: { type: Number, default: 40 },
    liveVelocityWeight: { type: Number, default: 60 },
    maxDailyTokensPerUser: { type: Number, default: 3 },
    maxConcurrentTokens: { type: Number, default: 1 },
    smsEnabled: { type: Boolean, default: true },
    pushEnabled: { type: Boolean, default: true },
    emailEnabled: { type: Boolean, default: true },
    notifyPeopleAhead: { type: Number, default: 5 },
    notifyMinutesAhead: { type: Number, default: 15 },
  },
  {
    timestamps: true,
  }
);

export const SystemSettings = mongoose.models.SystemSettings || mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);
