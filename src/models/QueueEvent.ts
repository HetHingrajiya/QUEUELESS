import mongoose, { Schema, Document } from 'mongoose';

export interface IQueueEvent extends Document {
  tokenId: mongoose.Types.ObjectId;
  officeId: mongoose.Types.ObjectId;
  eventType: 'CREATED' | 'CALLED' | 'COMPLETED' | 'NO_SHOW' | 'SKIPPED' | 'TRANSFERRED';
  counterId?: mongoose.Types.ObjectId;
  staffId?: mongoose.Types.ObjectId;
  metadata?: any;
  createdAt: Date;
}

const QueueEventSchema: Schema = new Schema(
  {
    tokenId: { type: Schema.Types.ObjectId, ref: 'Token', required: true, index: true },
    officeId: { type: Schema.Types.ObjectId, ref: 'Office', required: true, index: true },
    eventType: { 
      type: String, 
      enum: ['CREATED', 'CALLED', 'COMPLETED', 'NO_SHOW', 'SKIPPED', 'TRANSFERRED'], 
      required: true 
    },
    counterId: { type: Schema.Types.ObjectId, ref: 'Counter' },
    staffId: { type: Schema.Types.ObjectId, ref: 'User' },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only need when it happened
  }
);

export const QueueEvent = mongoose.models.QueueEvent || mongoose.model<IQueueEvent>('QueueEvent', QueueEventSchema);
