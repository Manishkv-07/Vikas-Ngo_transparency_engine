import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, default: 'staff' },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

export const User = mongoose.model<IUser>('User', UserSchema);
