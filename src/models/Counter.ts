import mongoose, { Schema, Document } from 'mongoose';

export enum CounterStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  OFFLINE = 'OFFLINE',
  MAINTENANCE = 'MAINTENANCE',
}

export interface ICounter extends Document {
  number: string;
  name: string;
  officeId: mongoose.Types.ObjectId;
  serviceId?: mongoose.Types.ObjectId;
  staffId?: mongoose.Types.ObjectId;
  currentServiceTokenId?: mongoose.Types.ObjectId;
  status: CounterStatus;
  createdAt: Date;
  updatedAt: Date;
}

const CounterSchema: Schema = new Schema(
  {
    number: { type: String, required: true },
    name: { type: String, required: true },
    officeId: { type: Schema.Types.ObjectId, ref: 'Office', required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
    staffId: { type: Schema.Types.ObjectId, ref: 'User' },
    currentServiceTokenId: { type: Schema.Types.ObjectId, ref: 'Token' },
    status: { 
      type: String, 
      enum: Object.values(CounterStatus), 
      default: CounterStatus.OFFLINE 
    },
  },
  {
    timestamps: true,
  }
);

CounterSchema.index({ number: 1, officeId: 1 }, { unique: true });

export const Counter = mongoose.models.Counter || mongoose.model<ICounter>('Counter', CounterSchema);
