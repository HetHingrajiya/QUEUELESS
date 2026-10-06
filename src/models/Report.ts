import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  name: string;
  reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM' | 'QUEUE' | 'STAFF' | 'SERVICE' | 'OFFICE';
  type: 'CSV' | 'PDF';
  organizationId?: mongoose.Types.ObjectId;
  generatedBy: mongoose.Types.ObjectId;
  dateRangeStart: Date;
  dateRangeEnd: Date;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  // Stored summary data
  summaryData?: {
    total: number;
    completed: number;
    waiting: number;
    serving: number;
    cancelled: number;
    skipped: number;
    noShow: number;
    avgWaitMin: number;
    avgServiceMin: number;
    noShowRate: string;
    completionRate: string;
  };
  officeBreakdown?: Array<{ name: string; total: number; completed: number }>;
  serviceBreakdown?: Array<{ name: string; total: number; completed: number }>;
  dailyBreakdown?: Array<{ day: string; count: number }>;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema(
  {
    name: { type: String, required: true },
    reportType: { type: String, enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM', 'QUEUE', 'STAFF', 'SERVICE', 'OFFICE'], default: 'CUSTOM' },
    type: { type: String, enum: ['CSV', 'PDF'], default: 'CSV' },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dateRangeStart: { type: Date, required: true },
    dateRangeEnd: { type: Date, required: true },
    status: { type: String, enum: ['PENDING', 'COMPLETED', 'FAILED'], default: 'COMPLETED' },
    summaryData: { type: Schema.Types.Mixed },
    officeBreakdown: { type: [Schema.Types.Mixed] },
    serviceBreakdown: { type: [Schema.Types.Mixed] },
    dailyBreakdown: { type: [Schema.Types.Mixed] },
  },
  {
    timestamps: true,
  }
);

export const Report = mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);
