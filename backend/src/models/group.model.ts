// src/models/group.model.ts

import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { IUser } from "./user.model";

// Interface for non-registered members
interface INonUserMember {
  name: string;
  phoneNumber: string;
}

// 1. Define a TypeScript interface for the Group document
export interface IGroup extends Document {
  name: string;
  description?: string;
  admin: IUser['_id'];
  members: IUser['_id'][];
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
    ref: 'User',
    required: true,
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  nonUserMembers: [{
    name: { type: String, required: true },
    phoneNumber: {
      type: String,
      required: true,
      match: [/^\+[1-9]\d{1,14}$/, 'Please fill a valid E.164 phone number format (e.g., +14155552671).'],
    },
  }],
}, { timestamps: true });


groupSchema.pre('validate', function(this: IGroup, next) {
  if (this.nonUserMembers && this.nonUserMembers.length > 0) {
    for (const member of this.nonUserMembers) {
      // Only normalize if it looks like a valid phone number without '+'
      // E.164 numbers are 1-15 digits after the '+'
      if (member.phoneNumber && /^\d{7,15}$/.test(member.phoneNumber)) {
        member.phoneNumber = `+${member.phoneNumber}`;
      }
    }
  }
  next();
});

// Pre-save hook to ensure the admin is a member
groupSchema.pre('save', function(this: IGroup, next) {
  // 👇 Create explicitly typed local variables
  const adminId = this.admin as Types.ObjectId;
  const members = this.members as Types.ObjectId[];

  // 👇 Perform the check on the new, strongly-typed variables
  const memberExists = members.some(
    (memberId) => memberId.equals(adminId)
  );

  if (!memberExists) {
    this.members.push(adminId);
  }
  next();
});


const Group: Model<IGroup> = mongoose.model<IGroup>("Group", groupSchema);

export default Group;