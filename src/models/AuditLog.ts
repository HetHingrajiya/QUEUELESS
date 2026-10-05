import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  userName?: string;
  userRole?: string;

  action: string;
  module: string;
  description: string;

  entityType?: string;
  entityId?: string;

  organizationId?: mongoose.Types.ObjectId;
  officeId?: mongoose.Types.ObjectId;

  ipAddress?: string;
  userAgent?: string;

  oldData?: any;
  newData?: any;

  status?: string;
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    userName: { type: String },
    userRole: { type: String },
    
    action: { type: String, required: true, index: true },
    module: { type: String, required: true, index: true },
    description: { type: String, required: true },
    
    entityType: { type: String },
    entityId: { type: String },
    
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    officeId: { type: Schema.Types.ObjectId, ref: 'Office', index: true },
    
    ipAddress: { type: String },
    userAgent: { type: String },
    
    oldData: { type: Schema.Types.Mixed },
    newData: { type: Schema.Types.Mixed },
    
    status: { type: String, default: 'SUCCESS' },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const AuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
