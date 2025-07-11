// src/models/activity.model.ts

import mongoose, { Document, Model, Schema } from "mongoose";
import { IGroup } from "./group.model";

// 1. Define a TypeScript interface for the Activity document
export interface IActivity extends Document {
  name: string;
  group: IGroup['_id']; // Reference to a Group document's ID
  recurrenceRule: string; // e.g., an iCal RRULE string like "FREQ=WEEKLY;BYDAY=TH"
  location?: string;
  time: string; // e.g., "19:00"
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
  },
  location: {
    type: String,
  },
  time: {
    type: String, // Stored in 24-hour format
    required: true,
  },
}, { timestamps: true });

// 3. Create and export the Mongoose model
const Activity: Model<IActivity> = mongoose.model<IActivity>("Activity", activitySchema);

export default Activity;