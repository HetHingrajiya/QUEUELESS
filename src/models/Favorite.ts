import mongoose, { Schema, Document } from 'mongoose';

export interface IFavorite extends Document {
  userId: mongoose.Types.ObjectId;
  officeId: mongoose.Types.ObjectId;
  serviceId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const FavoriteSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    officeId: { type: Schema.Types.ObjectId, ref: 'Office', required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

FavoriteSchema.index({ userId: 1, officeId: 1 }, { unique: true });

export const Favorite = mongoose.models.Favorite || mongoose.model<IFavorite>('Favorite', FavoriteSchema);
