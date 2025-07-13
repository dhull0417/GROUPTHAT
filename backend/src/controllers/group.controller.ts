import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Group, { IGroup } from '../models/group.model';
import User, { IUser } from '../models/user.model';

/**
 * Create a new group, making the creator the first admin.
 * Uses a transaction to ensure atomicity.
 */
export const createGroup = async (req: Request, res: Response) => {
    const { name, description } = req.body;
    
    // Find the user first. No need to start a transaction if the user doesn't exist.
    const user = await User.findOne({ clerkId: req.auth.userId }).select('_id');
    if (!user) {
        return res.status(404).json({ message: "Authenticated user not found." });
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const newGroup = new Group({
            name,
            description,
            admins: [user._id], // The creator is the first admin
            // A pre-save hook will also add the admin to members
        });

        // Operation 1: Save the new group within the transaction
        const savedGroup = await newGroup.save({ session });

        // Operation 2: Add the group to the user's list of groups within the transaction
        await User.updateOne(
            { _id: user._id },
            { $addToSet: { groups: savedGroup._id } },
            { session }
        );

        // If both operations succeed, commit the transaction
        await session.commitTransaction();

        res.status(201).json(savedGroup);

    } catch (error) {
        // If any error occurs, abort the transaction to roll back changes
        await session.abortTransaction();
        console.error("Transaction aborted. Error creating group:", error);
        res.status(500).json({ message: "Server error creating group. Operation rolled back." });

    } finally {
        // Always end the session
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