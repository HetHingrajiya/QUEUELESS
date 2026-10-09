import mongoose, { Schema, Document } from 'mongoose';

export interface ITokenSequence extends Document {
  officeId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  seq: number;
  createdAt: Date;
  updatedAt: Date;
}

const TokenSequenceSchema = new Schema(
  {
    officeId: { type: Schema.Types.ObjectId, ref: 'Office', required: true },
    date: { type: String, required: true },
    seq: { type: Number, default: 0 }
  },
  { timestamps: true }
);

TokenSequenceSchema.index({ officeId: 1, date: 1 }, { unique: true });

export const TokenSequence =
  mongoose.models.TokenSequence || mongoose.model<ITokenSequence>('TokenSequence', TokenSequenceSchema);
