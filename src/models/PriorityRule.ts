import mongoose, { Schema, Document } from 'mongoose';

export interface IPriorityRule extends Document {
  name: string;
  description: string;
  priorityMultiplier: number; // Higher number means higher priority
  status: 'ACTIVE' | 'INACTIVE';
  organizationId: mongoose.Types.ObjectId;
  officeId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PriorityRuleSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    priorityMultiplier: { type: Number, required: true, default: 1 },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    officeId: { type: Schema.Types.ObjectId, ref: 'Office' },
  },
  {
    timestamps: true,
  }
);

export const PriorityRule = mongoose.models.PriorityRule || mongoose.model<IPriorityRule>('PriorityRule', PriorityRuleSchema);
