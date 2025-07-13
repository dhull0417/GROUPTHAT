import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { IUser } from "./user.model";

// Interface for non-registered members
export interface INonUserMember {
  name: string;
  phone: string;
}

// 1. Define a TypeScript interface for the Group document
export interface IGroup extends Document {
  name: string;
  description?: string;
  coverImage?: string;
  admins: Types.ObjectId[]; // CHANGED: From single 'admin' to an array 'admins'
  members: Types.ObjectId[];
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
  coverImage: {
    type: String,
  },
  // CHANGED: To support multiple admins for future flexibility
  admins: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  nonUserMembers: [{
    name: { type: String, required: true },
    phone: { type: String, required: true },
  }],
}, { timestamps: true });

// Ensure there is at least one admin

groupSchema.path('admins').validate(function (value) {
  // 'this' refers to the document being validated
  // The value is the admins array
  return value && value.length > 0;
}, 'At least one admin is required.');


// Pre-save hook to ensure all admins are also members
groupSchema.pre('save', function(this: IGroup, next) {
  for (const adminId of this.admins) {
    // Check if the admin is already in the members list
    const isMember = this.members.some(memberId => memberId.equals(adminId));
    if (!isMember) {
      // If not, add them.
      this.members.push(adminId);
    }
  }
  next();
});


const Group: Model<IGroup> = mongoose.model<IGroup>("Group", groupSchema);

export default Group;