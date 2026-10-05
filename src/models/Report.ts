import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  name: string;
  type: string;
  organizationId?: mongoose.Types.ObjectId;
  generatedBy: mongoose.Types.ObjectId;
  fileSize: string; // e.g., '1.2 MB'
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileSize: { type: String, default: '0 KB' },
    status: { type: String, enum: ['PENDING', 'COMPLETED', 'FAILED'], default: 'COMPLETED' },
  },
  {
    timestamps: true,
  }
);

export const Report = mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);
