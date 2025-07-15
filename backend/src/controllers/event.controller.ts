import { Request, Response } from 'express';
import mongoose, { UpdateQuery } from 'mongoose';
import Event, { IEvent } from '../models/event.model';
import User, { IUser } from '../models/user.model';
import Group from '../models/group.model';

/**
 * Retrieves the upcoming event for a specific group.
 * The user must be a member of the group to view the event.
 */
export const getUpcomingEventForGroup = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const clerkId = req.auth.userId;

        // 1. Verify the authenticated user exists in the database
        const user = await User.findOne({ clerkId }).select('_id').lean();
        if (!user) {
            return res.status(404).json({ message: "Authenticated user not found in database." });
        }

        // 2. Verify the user is a member of the requested group
        const group = await Group.findOne({ _id: groupId, members: user._id }).select('_id').lean();
        if (!group) {
            return res.status(403).json({ message: "Forbidden: You are not a member of this group." });
        }

        // 3. Find the upcoming event for that group
        const upcomingEvent = await Event.findOne({ group: groupId })
            .populate<{ attendees: IUser[], absentees: IUser[] }>('attendees absentees', 'firstName lastName profilePicture')
            .select('-__v');

        if (!upcomingEvent) {
            return res.status(404).json({ message: "No upcoming event found for this group." });
        }

        res.status(200).json(upcomingEvent);

    } catch (error) {
        console.error("Error fetching upcoming event:", error);
        res.status(500).json({ message: "Server error fetching upcoming event." });
    }
};

/**
 * Allows the authenticated user to update their own attendance status.
 * Accepts "attend", "absent", or "undecided".
 * Uses a transaction to ensure atomicity.
 */
export const updateMyAttendance = async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const { status } = req.body;
    const clerkId = req.auth.userId;

    const validStatuses = ['in', 'out', 'undecided'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status provided. Must be 'in', 'out', or 'undecided'." });
    }

    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const user = await User.findOne({ clerkId }).select('_id').session(session).lean();
        if (!user) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Authenticated user not found in database." });
        }
        const userId = user._id;

        const event = await Event.findById(eventId).select('group').session(session).lean();
        if (!event) {
             await session.abortTransaction();
             return res.status(404).json({ message: "Event not found." });
        }
        
        const isMember = await Group.exists({ _id: event.group, members: userId }).session(session);
        if (!isMember) {
             await session.abortTransaction();
             return res.status(403).json({ message: "Forbidden: You are not a member of this event's group." });
        }

        let updateQuery: UpdateQuery<IEvent>;

        switch (status) {
            case 'in':
                updateQuery = {
                    $addToSet: { attendees: userId },
                    $pull: { absentees: userId }
                };
                break;
            case 'out':
                updateQuery = {
                    $addToSet: { absentees: userId },
                    $pull: { attendees: userId }
                };
                break;
            case 'undecided':
                updateQuery = {
                    $pull: { attendees: userId, absentees: userId }
                };
                break;
            default:
                // This case is logically unreachable but satisfies TypeScript's
                // strict control flow analysis.
                await session.abortTransaction();
                throw new Error("Invalid attendance status reached internal logic.");
        }
        
        await Event.updateOne({ _id: eventId }, updateQuery, { session });

        await session.commitTransaction();
        res.status(200).json({ message: `Successfully updated status to '${status}'.` });

    } catch (error: any) {
        await session.abortTransaction();
        console.error("Error updating attendance:", error);
        res.status(500).json({ message: error.message || "Server error while updating attendance status." });
    } finally {
        session.endSession();
    }
};