import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  id: number;
  name: string;
  slug: string;
  category: string;
  location: string;
  description: string;
  budget: string;
  beneficiaries: number;
  status: string;
  startDate: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  budget: { type: String, required: true },
  beneficiaries: { type: Number, required: true },
  status: { type: String, required: true, default: 'active' },
  startDate: { type: Date, required: true, default: Date.now },
  createdBy: { type: String },
}, {
  timestamps: true,
});

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
