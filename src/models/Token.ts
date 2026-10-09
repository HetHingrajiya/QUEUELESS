import mongoose, { Schema, Document } from 'mongoose';

export enum TokenStatus {
  WAITING = 'WAITING',
  CALLED = 'CALLED',
  CHECKED_IN = 'CHECKED_IN',
  SERVING = 'SERVING',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
  NO_SHOW = 'NO_SHOW',
  CANCELLED = 'CANCELLED',
}

export interface IToken extends Document {
  tokenNumber: string;
  citizenId: mongoose.Types.ObjectId;
  officeId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  counterId?: mongoose.Types.ObjectId;
  staffId?: mongoose.Types.ObjectId;
  status: TokenStatus;
  estimatedWaitTime?: number; // in minutes
  recommendedArrivalTime?: Date;
  checkInTime?: Date;
  callTime?: Date;
  startTime?: Date;
  completionTime?: Date;
  processingTime?: number; // in seconds
  queuePosition?: number;
  endTime?: Date;
  cancellationReason?: string;
  notes?: string;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TokenSchema: Schema = new Schema(
  {
    tokenNumber: { type: String, required: true },
    citizenId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    officeId: { type: Schema.Types.ObjectId, ref: 'Office', required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    counterId: { type: Schema.Types.ObjectId, ref: 'Counter' },
    staffId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { 
      type: String, 
      enum: Object.values(TokenStatus), 
      default: TokenStatus.WAITING,
      index: true
    },
    estimatedWaitTime: { type: Number },
    recommendedArrivalTime: { type: Date },
    checkInTime: { type: Date },
    callTime: { type: Date },
    startTime: { type: Date },
    completionTime: { type: Date },
    processingTime: { type: Number },
    queuePosition: { type: Number },
    endTime: { type: Date },
    cancellationReason: { type: String },
    notes: { type: String },
    cancelledAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

TokenSchema.index({ createdAt: 1, officeId: 1 });

export const Token = mongoose.models.Token || mongoose.model<IToken>('Token', TokenSchema);
