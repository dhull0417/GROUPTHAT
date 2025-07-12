import mongoose, { Document, Model, Schema, Types } from "mongoose";

// 1. Define a TypeScript interface for the User document
export interface IUser extends Document {
  clerkId: string;
  firstName: string; // CHANGED: Replaced 'name'
  lastName: string;  // ADDED
  phone: string;
  profilePicture?: string;
  bio?: string;
  groups: Types.ObjectId[];
}

// 2. Create the Mongoose schema using the interface
const userSchema = new Schema<IUser>({
  clerkId: {
    type: String,
    required: true,
    unique: true,
  },
  // CHANGED: Using separate fields for first and last name
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  profilePicture: {
    type: String,
  },
  bio: {
    type: String,
    maxlength: 250,
  },
  groups: [{
    type: Schema.Types.ObjectId,
    ref: 'Group',
  }],
}, { timestamps: true });

// 3. Create and export the Mongoose model
const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
