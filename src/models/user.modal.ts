import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  clerkId: string;
  email: string;
  name?: string;
  username?: string;
  imageUrl?: string;
}

const UserSchema: Schema = new Schema<IUser>({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String },
  username: { type: String },
  imageUrl: { type: String },
});

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
