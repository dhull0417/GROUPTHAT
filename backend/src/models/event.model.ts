// src/models/event.model.ts

import mongoose, { Document, Model, Schema, Types } from "mongoose";
import Activity, { IActivity } from "./activity.model.js";
import { IGroup } from "./group.model.js";
import { IUser } from "./user.model.js";

export interface IEvent extends Document {
  activity: IActivity['_id'];
  group: IGroup['_id'];
  date: Date;
  attendees: IUser['_id'][];
  absentees: IUser['_id'][];
}

const eventSchema = new Schema<IEvent>({
  activity: {
    type: Schema.Types.ObjectId,
    ref: 'Activity',
    required: true,
  },
  group: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  attendees: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  absentees: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
}, { timestamps: true });


eventSchema.pre('save', async function(this: IEvent, next) {
  try {
    const activityDoc = await Activity.findById(this.activity);

    if (!activityDoc) {
      throw new Error('Referenced activity does not exist.');
    }

    const activityGroup = activityDoc.group as Types.ObjectId;
    const eventGroup = this.group as Types.ObjectId;

    if (!activityGroup.equals(eventGroup)) {
      throw new Error("Data inconsistency: Event group does not match the activity's group.");
    }
    
    // 👇 Create explicitly typed local variables for the arrays
    const attendees = this.attendees as Types.ObjectId[];
    const absentees = this.absentees as Types.ObjectId[];

    // 👇 Perform the check on the new, strongly-typed variables
    const hasOverlap = attendees.some(
      (attendeeId) => absentees.some(
        (absenteeId) => absenteeId.equals(attendeeId)
      )
    );

    if (hasOverlap) {
      throw new Error('A user cannot be in both the attendees and absentees list.');
    }

    next();
  } catch (error: any) {
    next(error);
  }
});


const Event: Model<IEvent> = mongoose.model<IEvent>("Event", eventSchema);

export default Event;