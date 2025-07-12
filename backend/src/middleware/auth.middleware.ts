import { Response, NextFunction, Request } from 'express';
import mongoose from 'mongoose'; // ADDED: This line fixes the error.
import Group from '../models/group.model';

/**
 * Custom middleware to verify if the authenticated user is an admin for the group.
 * This queries the database, making it the single source of truth.
 */
export const requireGroupAdmin = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { groupId } = req.params;
      if (!groupId) {
        return res.status(400).json({ message: "Group ID is required in the URL parameter." });
      }

      const group = await Group.findById(groupId).select('admins');
      if (!group) {
        return res.status(404).json({ message: "Group not found." });
      }
      
      // Find the user's document ID based on their Clerk ID to check against the admins list.
      const user = await mongoose.model('User').findOne({ clerkId: req.auth.userId }).select('_id');
      if (!user) {
          return res.status(404).json({ message: "Authenticated user not found in database." });
      }

      // Check if the user's database ID is in the group's admins array.
      const isAdmin = group.admins.some(adminId => adminId.equals(user._id));

      if (isAdmin) {
        return next(); // Success: User is an admin.
      }

      // Failure: User is not an admin.
      return res.status(403).json({ message: "Forbidden: You do not have admin rights for this group." });

    } catch (error) {
      console.error("Authorization Error:", error);
      return res.status(500).json({ message: "Error in authorization middleware." });
    }
  };
};