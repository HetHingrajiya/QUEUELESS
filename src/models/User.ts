import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  CITIZEN = 'CITIZEN',
}

export interface IUser extends Document {
  fullName: string;
  email: string;
  mobile?: string;
  password?: string;
  role: UserRole;
  organizationId?: mongoose.Types.ObjectId;
  officeId?: mongoose.Types.ObjectId;
  serviceId?: mongoose.Types.ObjectId; // For staff
  counterId?: mongoose.Types.ObjectId; // For staff
  roleId?: mongoose.Types.ObjectId; // Custom role for permissions
  employeeId?: string; // For staff
  status: 'ACTIVE' | 'INACTIVE';
  lastLogin?: Date;
  pushSubscription?: any;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, unique: true, sparse: true },
    password: { type: String }, // optional for citizens who might use OTP or oauth
    role: { 
      type: String, 
      enum: Object.values(UserRole),
      required: true,
      index: true
    },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    officeId: { type: Schema.Types.ObjectId, ref: 'Office', index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
    counterId: { type: Schema.Types.ObjectId, ref: 'Counter' },
    roleId: { type: Schema.Types.ObjectId, ref: 'Role' },
    employeeId: { type: String },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    lastLogin: { type: Date },
    pushSubscription: { type: Schema.Types.Mixed }, // Stores Web Push Subscription object
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
