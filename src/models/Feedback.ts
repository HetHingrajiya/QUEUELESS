import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  userId: mongoose.Types.ObjectId;
  tokenId?: mongoose.Types.ObjectId;
  officeId: mongoose.Types.ObjectId;
  serviceId?: mongoose.Types.ObjectId;
  rating: number;
  courtesyRating?: number;
  waitAccuracyRating?: number;
  cleanlinessRating?: number;
  comment?: string;
  officeResponse?: string;
  status: 'SUBMITTED' | 'ACKNOWLEDGED' | 'RESOLVED';
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenId: { type: Schema.Types.ObjectId, ref: 'Token' },
    officeId: { type: Schema.Types.ObjectId, ref: 'Office', required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    courtesyRating: { type: Number, min: 1, max: 5 },
    waitAccuracyRating: { type: Number, min: 1, max: 5 },
    cleanlinessRating: { type: Number, min: 1, max: 5 },
    comment: { type: String, trim: true },
    officeResponse: { type: String, trim: true },
    status: { 
      type: String, 
      enum: ['SUBMITTED', 'ACKNOWLEDGED', 'RESOLVED'], 
      default: 'SUBMITTED',
      index: true 
    },
  },
  {
    timestamps: true,
  }
);

FeedbackSchema.index({ tokenId: 1 }, { unique: true, sparse: true });

export const Feedback = mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', FeedbackSchema);
