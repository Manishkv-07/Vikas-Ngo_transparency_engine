import mongoose, { Document, Schema } from 'mongoose';

export interface IDonation extends Document {
  donorName: string;
  amount: string;
  date: Date;
  proofPath?: string;
  projectId?: number;
  message?: string;
  createdAt: Date;
}

const DonationSchema: Schema = new Schema({
  donorName: { type: String, required: true },
  amount: { type: String, required: true },
  date: { type: Date, required: true },
  proofPath: { type: String },
  projectId: { type: Number },
  message: { type: String },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

export const Donation = mongoose.model<IDonation>('Donation', DonationSchema);
