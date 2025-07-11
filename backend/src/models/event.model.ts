// src/models/event.model.ts

import mongoose, { Document, Model, Schema } from "mongoose";
import { IActivity } from "./activity.model";
import { IGroup } from "./group.model";
import { IUser } from "./user.model";

// 1. Define a TypeScript interface for the Event document
export interface IEvent extends Document {
  activity: IActivity['_id'];
  group: IGroup['_id'];
  date: Date;
  attendees: IUser['_id'][]; // Users who are "In"
  absentees: IUser['_id'][]; // Users who are "Out"
}

// 2. Create the Mongoose schema using the interface
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

// 3. Create and export the Mongoose model
const Event: Model<IEvent> = mongoose.model<IEvent>("Event", eventSchema);

export default Event;