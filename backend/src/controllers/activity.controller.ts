import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Activity from '../models/activity.model.js';
import Group, { IGroup } from '../models/group.model.js';
import User from '../models/user.model.js';
import * as rrule from 'rrule';


/**
 * Retrieves details of a single activity.
 * A user must be a member of the activity's group to view it.
 */
export const getActivity = async (req: Request, res: Response) => {
    try {
        const { activityId } = req.params;
        const activity = await Activity.findById(activityId).populate<{group: IGroup}>('group', 'name members');

        if (!activity) {
            return res.status(404).json({ message: "Activity not found." });
        }
        
                // FIX: Use an inline type assertion to avoid the "Cannot find name" error.
        const user = await User.findOne({ clerkId: req.auth.userId }).select<{ _id: mongoose.Types.ObjectId }>('_id');
        if (!user) {
            return res.status(404).json({ message: "Authenticated user not found." });
        }

        // Authorization: Check if user is a member of the group.
        // This comparison now works because TypeScript knows the shape of the user object.
        const isMember = activity.group.members.some((memberId: mongoose.Types.ObjectId) => memberId.toString() === user._id.toString());
        if (!isMember) {
            return res.status(403).json({ message: "Forbidden: You are not a member of this activity's group." });
        }
        
        // **FIX:** Construct a new, sanitized object for the final response.
        const activityObject = activity.toObject();
        const { members, ...safeGroup } = activityObject.group;

        // Create the final response by combining the activity data with the sanitized group data.
        const finalResponse = {
            ...activityObject,
            group: safeGroup,
        };

        res.status(200).json(finalResponse);

    } catch (error) {
        res.status(500).json({ message: "Server error fetching activity details." });
    }
};

/**
 * Updates an existing activity's details.
 * The user must be an admin of the activity's group.
 */
export const updateActivity = async (req: Request, res: Response) => {
    try {
        const { activityId } = req.params;
        const updateData = req.body;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "No update fields provided." });
        }
        if (updateData.recurrenceRule) {
            // FIX 2: Access the 'rrulestr' function from the imported 'rrule' object.
            rrule.rrulestr(updateData.recurrenceRule); // Validate new rule before proceeding
        }

        const activity = await Activity.findById(activityId);
        if (!activity) {
            return res.status(404).json({ message: "Activity not found." });
        }

        const updatedActivity = await Activity.findByIdAndUpdate(activityId, { $set: updateData }, { new: true, runValidators: true });
        res.status(200).json(updatedActivity);

    } catch (error: any) {
         if (error.name === 'ValidationError') {
            return res.status(400).json({ message: `Validation Error: ${error.message}` });
        }
        res.status(500).json({ message: "Server error updating activity." });
    }
};

/**
 * Deletes an activity and unlinks it from its group.
 * The user must be an admin of the activity's group.
 */
export const deleteActivity = async (req: Request, res: Response) => {
    const { activityId } = req.params;
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const activity = await Activity.findById(activityId).session(session);
        if (!activity) {
            const error = new Error("Activity not found.");
            (error as any).status = 404;
            throw error;
        }
        
        // Operation 1: Unlink the activity from the group
        await Group.updateOne({ _id: activity.group }, { $unset: { activity: "" } }, { session });

        // Operation 2: Delete the activity itself
        await Activity.findByIdAndDelete(activityId, { session });

        await session.commitTransaction();
        res.status(200).json({ message: "Activity was successfully deleted." });

    } catch (error: any) {
        await session.abortTransaction();
        res.status(error.status || 500).json({ message: error.message || "Server error deleting activity." });
    } finally {
        session.endSession();
    }
};