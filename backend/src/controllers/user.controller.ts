import { Request, Response } from 'express';
import User, { IUser } from '../models/user.model';
import { IGroup } from '../models/group.model';

/**
 * Get the profile of the currently authenticated user.
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId })
      .select('-__v')
      .populate<{ groups: IGroup[] }>('groups', 'name coverImage');

    if (!user) {
      return res.status(404).json({ message: "Authenticated user not found in database." });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching current user profile." });
  }
};

/**
 * Get a public-facing user profile by their database ID.
 */
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    // CHANGED: Selects firstName and lastName instead of a single name field.
    const user = await User.findById(req.params.userId).select('firstName lastName profilePicture bio');
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching user profile." });
  }
};

/**
 * Get all groups that the currently authenticated user is a member of.
 */
export const getUserGroups = async (req: Request, res: Response) => {
    try {
        const user = await User.findOne({ clerkId: req.auth.userId })
            .select('groups')
            .populate<{ groups: IGroup[] }>('groups', 'name coverImage');

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        res.status(200).json(user.groups);
    } catch (error) {
        res.status(500).json({ message: "Server error fetching user's groups." });
    }
};

/**
 * Update the profile of the currently authenticated user.
 */
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    // CHANGED: Allows updating firstName, lastName, and bio.
    const { firstName, lastName, bio } = req.body;
    const clerkId = req.auth.userId;

    const fieldsToUpdate: { [key: string]: any } = {};
    if (firstName) fieldsToUpdate.firstName = firstName;
    if (lastName) fieldsToUpdate.lastName = lastName;
    if (bio) fieldsToUpdate.bio = bio;

    if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(400).json({ message: "No update fields provided." });
    }

    const updatedUser = await User.findOneAndUpdate(
      { clerkId },
      { $set: fieldsToUpdate },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found for update." });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Server error while updating profile." });
  }
};

/**
 * Creates a new user in the database from a Clerk webhook.
 */
export const syncNewUser = async (req: Request, res: Response) => {
  try {
    const { id, phone_numbers, first_name, last_name, image_url } = req.body.data;
    if (!id) {
        return res.status(400).json({ message: "Webhook data is missing user ID." });
    }

    const existingUser = await User.findOne({ clerkId: id });
    if (existingUser) {
      return res.status(200).json({ message: "User already exists." });
    }

    // CHANGED: Saves first_name and last_name from Clerk into their respective fields.
    const phoneNumber = phone_numbers?.[0]?.phone_number;
    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required for user creation." });
    }
    const newUser = new User({
      clerkId: id,
      phone: phoneNumber,
      firstName: first_name || '',
      lastName: last_name || '',
      profilePicture: image_url,
    });

    await newUser.save();
    res.status(201).json({ message: "User synced successfully.", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Server error during user sync." });
  }
};
