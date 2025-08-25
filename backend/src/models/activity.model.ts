// src/models/activity.model.ts

import mongoose, { Document, Model, Schema } from "mongoose";
import { IGroup } from "./group.model.js";
import * as rrule from "rrule";

// Define the TypeScript interface for the Activity document
export interface IActivity extends Document {
  name: string;
  group: IGroup['_id'];
  recurrenceRule: string;
  location?: string;
  time: Date; // Changed from string to Date
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
        rrule.rrulestr(rule);
          return true;
        } catch (error) {
          return false;
        }
      },
      message: (props: any) => `${props.value} is not a valid iCal RRULE string.`
    },
  },
  location: {
    type: String,
  },
  // 3. Update the schema definition
  time: {
    type: Date, // Changed from String to Date
    required: true,
  },
}, { timestamps: true });

const Activity: Model<IActivity> = mongoose.model<IActivity>("Activity", activitySchema);

export default Activity;