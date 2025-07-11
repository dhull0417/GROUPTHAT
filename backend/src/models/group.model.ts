// src/models/group.model.ts

import mongoose, { Document, Model, Schema } from "mongoose";
import { IUser } from "./user.model"; // Import the User interface

// Interface for non-registered members
interface INonUserMember {
  name: string;
  phoneNumber: string;
}

// 1. Define a TypeScript interface for the Group document
export interface IGroup extends Document {
  name: string;
  description?: string;
  admin: IUser['_id']; // Reference to a User document's ID
  members: IUser['_id'][]; // Array of User document IDs
  nonUserMembers: INonUserMember[];
}

// 2. Create the Mongoose schema using the interface
const groupSchema = new Schema<IGroup>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
  },
  admin: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Creates the relationship to the User model
    required: true,
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  nonUserMembers: [{
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
  }],
}, { timestamps: true });

// 3. Create and export the Mongoose model
const Group: Model<IGroup> = mongoose.model<IGroup>("Group", groupSchema);

export default Group;