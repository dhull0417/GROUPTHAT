// src/models/user.model.ts

import mongoose, { Document, Model, Schema } from "mongoose";

// 1. Define a TypeScript interface for the User document
export interface IUser extends Document {
  clerkId: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string; // The '?' makes this field optional
}

// 2. Create the Mongoose schema using the interface
const userSchema = new Schema<IUser>({
  clerkId: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true, // Phone number required
    unique: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values, but unique if a value exists
    trim: true,
  },
}, { timestamps: true });

// 3. Create and export the Mongoose model
const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;