import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  id: number;
  action: string;
  entityType: string;
  entityId?: number;
  userId?: string;
  userEmail?: string;
  summary: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema({
  id: { type: Number, required: true, unique: true },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: Number },
  userId: { type: String },
  userEmail: { type: String },
  summary: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
