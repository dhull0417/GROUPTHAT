// src/models/activity.model.ts

import mongoose, { Document, Model, Schema } from "mongoose";
import { IGroup } from "./group.model";
import { RRule } from "rrule"; // 👈 Import the RRule class

// 1. Define a TypeScript interface for the Activity document
export interface IActivity extends Document {
  name: string;
  group: IGroup['_id'];
  recurrenceRule: string;
  location?: string;
  time: string;
}

// 2. Create the Mongoose schema using the interface
const activitySchema = new Schema<IActivity>({
  name: {
    type: String,
    required: true,
  },
  group: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  recurrenceRule: {
    type: String,
    required: true,
    // 👇 Add the custom validator
    validate: {
      validator: (rule: string) => {
        try {
          // Attempt to parse the string. If it's invalid, it will throw an error.
          RRule.fromString(rule);
          return true; // Validation passes
        } catch (error) {
          return false; // Validation fails
        }
      },
      message: "Invalid iCal RRULE format.",
    },
  },
  location: {
    type: String,
  },
  time: {
    type: String,
    required: true,
  },
}, { timestamps: true });

// 3. Create and export the Mongoose model
const Activity: Model<IActivity> = mongoose.model<IActivity>("Activity", activitySchema);

export default Activity;