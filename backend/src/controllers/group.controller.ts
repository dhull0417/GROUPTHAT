import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Group, { IGroup } from '../models/group.model.js';
import User, { IUser } from '../models/user.model.js';
import Activity from '../models/activity.model.js';
import Event from '../models/event.model.js';
import * as rrule from 'rrule';

/**
 * Create a new group, making the creator the first admin.
 * Uses a transaction to ensure atomicity.
 */
export const createGroupAndActivity = async (req: Request, res: Response) => {
    // Expect all details in one request
    const { groupName, description, activityName, recurrenceRule, location, time } = req.body;
    
    // 1. Validate all required inputs
    if (!groupName || !activityName || !recurrenceRule || !time) {
        return res.status(400).json({ message: "groupName, activityName, recurrenceRule, and time are required." });
    }

    const user = await User.findOne({ clerkId: req.auth.userId }).select('_id');
    if (!user) {
        return res.status(404).json({ message: "Authenticated user not found." });
    }

    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        // Operation 1: Create the Group document
        const newGroup = new Group({
            name: groupName,
            description,
            admins: [user._id],
        });
        const savedGroup = await newGroup.save({ session });

        // Operation 2: Create the linked Activity document
        const newActivity = new Activity({
            name: activityName,
            group: savedGroup._id,
            recurrenceRule,
            location,
            time,
        });
        const savedActivity = await newActivity.save({ session });

        // Operation 3: Calculate the first event date
        // FIX 2: Access the 'rrulestr' function from the imported 'rrule' object.
        const rule = rrule.rrulestr(savedActivity.recurrenceRule);
        const firstEventDate = rule.after(new Date(), true); // Get first occurrence after right now

        if (!firstEventDate) {
            // This can happen if the rule has an end date (UNTIL) that's in the past.
            throw new Error("Could not calculate a future event date based on the provided rule.");
        }

        // Operation 4: Create the first Event document
        const newEv = new Event({
            activity: savedActivity._id,
            group: savedGroup._id,
            date: firstEventDate,
            // attendees and absentees default to empty arrays per your model
        });
        await newEv.save({ session });

        // Operation 5: Atomically link the activity back to the group
        await Group.updateOne({ _id: savedGroup._id }, { $set: { activity: savedActivity._id } }, { session });

        // Operation 6: Add the new group to the user's document
        await User.updateOne({ _id: user._id }, { $addToSet: { groups: savedGroup._id } }, { session });

        await session.commitTransaction();
        
        const finalGroup = await Group.findById(savedGroup._id).populate('activity').lean();
        res.status(201).json(finalGroup);

    } catch (error) {
        await session.abortTransaction();
        console.error("Transaction aborted. Error creating group and activity:", error);
        res.status(500).json({ message: "Failed to create group. Operation rolled back." });

    } finally {
        session.endSession();
    }
};

/**
 * Get details of a single group.
 */
export const getGroupDetails = async (req: Request, res: Response) => {
  try {
    // CHANGED: Populates members and admins with firstName and lastName.
    const group = await Group.findById(req.params.groupId)
      .populate<{ members: IUser[], admins: IUser[] }>('members admins', 'firstName lastName profilePicture');

    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }
    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching group details." });
  }
};

/**
 * Allows the authenticated user to leave a group.
 */
export const leaveGroup = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const user = await User.findOne({ clerkId: req.auth.userId });
        if (!user) {
            return res.status(404).json({ message: "Current user not found in database." });
        }

        await Group.updateOne({ _id: groupId }, { $pull: { members: user._id, admins: user._id } });
        await User.updateOne({ _id: user._id }, { $pull: { groups: groupId } });

        res.status(200).json({ message: "Successfully left group." });
    } catch (error) {
        res.status(500).json({ message: "Server error while leaving group." });
    }
};

/**
 * [Admin] Adds a member to a group. If the user exists, adds them to 'members'.
 * If not, adds them to 'nonUserMembers'.
 */
export const addMember = async (req: Request, res: Response) => {
  try {
    const { phone, name } = req.body;
    const { groupId } = req.params;

    const existingUser = await User.findOne({ phone });

    if (existingUser) {
      // User is registered, add them to the main members list
      await Group.updateOne({ _id: groupId }, { $addToSet: { members: existingUser._id } });
      await User.updateOne({ _id: existingUser._id }, { $addToSet: { groups: groupId } });
      res.status(200).json({ message: "Registered user added to group." });
    } else {
      // User is not registered, add to nonUserMembers
      if (!name) {
        return res.status(400).json({ message: "Name is required for non-registered members." });
      }
      await Group.updateOne(
        { _id: groupId },
        { $addToSet: { nonUserMembers: { name, phone } } }
      );
      res.status(200).json({ message: "Non-registered member added to group." });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error while adding member." });
  }
};

/**
 * [Admin] Removes a member from a group, handling both registered and non-registered users.
 */
export const removeMember = async (req: Request, res: Response) => {
  try {
    const { userId, phone } = req.body; // Can remove by userId or phone
    const { groupId } = req.params;

    if (userId) {
      // Remove a registered user
      await User.updateOne({ _id: userId }, { $pull: { groups: groupId } });
      await Group.updateOne({ _id: groupId }, { $pull: { members: userId, admins: userId } });
      res.status(200).json({ message: "Registered member removed." });
    } else if (phone) {
      // Remove a non-registered user
      await Group.updateOne({ _id: groupId }, { $pull: { nonUserMembers: { phone: phone } } });
      res.status(200).json({ message: "Non-registered member removed." });
    } else {
      return res.status(400).json({ message: "Either userId or phone is required to remove a member." });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error while removing member." });
  }
};

/**
 * [Admin] Dissolve a group entirely.
 */
export const deleteGroup = async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const session = await mongoose.startSession(); // Start a session

  try {
    session.startTransaction(); // Start the transaction

    // Find the group to get its members before deletion
    const groupToDelete = await Group.findById(groupId).session(session);
    if (!groupToDelete) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Group not found" });
    }

    // Operation 1: Remove the group from all members' 'groups' array
    await User.updateMany(
      { _id: { $in: groupToDelete.members } },
      { $pull: { groups: groupId } },
      { session } // Pass the session to the operation
    );

    // Operation 2: Delete the group itself
    await Group.findByIdAndDelete(groupId).session(session);

    // If both operations succeed, commit the transaction
    await session.commitTransaction();

    res.status(200).json({ message: "Group and user references deleted successfully" });

  } catch (error) {
    // If any error occurs, abort the entire transaction
    await session.abortTransaction();
    console.error("Transaction aborted. Error deleting group:", error);
    res.status(500).json({ message: "Failed to delete group. Operation rolled back." });

  } finally {
    // End the session regardless of outcome
    session.endSession();
  }
};