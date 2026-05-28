import mongoose, { Document, Schema } from 'mongoose';

export interface IExpense extends Document {
  id: number;
  projectId: number;
  vendor: string;
  category: string;
  description: string;
  amount: string;
  receiptPath?: string;
  riskScore: number;
  riskFlags: string[];
  riskReasoning?: string;
  flagged: boolean;
  spentAt: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema: Schema = new Schema({
  id: { type: Number, required: true, unique: true },
  projectId: { type: Number, required: true, index: true },
  vendor: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: String, required: true },
  receiptPath: { type: String },
  riskScore: { type: Number, required: true, default: 0 },
  riskFlags: [{ type: String }],
  riskReasoning: { type: String },
  flagged: { type: Boolean, required: true, default: false },
  spentAt: { type: Date, required: true },
  createdBy: { type: String },
}, {
  timestamps: true,
});

export const Expense = mongoose.model<IExpense>('Expense', ExpenseSchema);
