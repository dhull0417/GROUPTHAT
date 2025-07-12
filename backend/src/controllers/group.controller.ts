import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Group, { IGroup } from '../models/group.model';
import User, { IUser } from '../models/user.model';

/**
 * Create a new group, making the creator the first admin.
 */
export const createGroup = async (req: Request, res: Response) => {
    try {
        const { name, description } = req.body;
        const user = await User.findOne({ clerkId: req.auth.userId }).select('_id');
        if (!user) {
            return res.status(404).json({ message: "Authenticated user not found." });
        }

        const newGroup = new Group({
            name,
            description,
            admins: [user._id], // The creator is the first admin
        });

        await newGroup.save(); // The pre-save hook will also add the admin to members
        
        // Add the group to the user's list of groups
        await User.updateOne({ _id: user._id }, { $addToSet: { groups: newGroup._id } });

        res.status(201).json(newGroup);
    } catch (error) {
        res.status(500).json({ message: "Server error creating group." });
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
export const dissolveGroup = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    
    await User.updateMany({ groups: groupId }, { $pull: { groups: groupId } });
    await Group.findByIdAndDelete(groupId);

    res.status(200).json({ message: "Group has been dissolved successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error while dissolving group." });
  }
};
