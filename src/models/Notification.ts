import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  officeId?: mongoose.Types.ObjectId;
  tokenId?: mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  channel: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    officeId: { type: Schema.Types.ObjectId, ref: 'Office' },
    tokenId: { type: Schema.Types.ObjectId, ref: 'Token' },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    channel: { type: String, default: 'IN_APP', enum: ['IN_APP', 'SOCKET', 'PUSH'] },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Prevent overwrite model error
export const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
