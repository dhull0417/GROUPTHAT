import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import { requireGroupAdmin } from '../middleware/auth.middleware';
import {
    createGroupAndActivity,
    getGroupDetails,
    addMember,
    removeMember,
    deleteGroup,
    leaveGroup
} from '../controllers/group.controller';

const router = Router();

// --- BASE PROTECTION ---
router.use(requireAuth());

// --- ROUTES FOR ANY LOGGED-IN USER ---
router.post("/", createGroupAndActivity); // Create a new group and activity
router.get("/:groupId", getGroupDetails);
router.delete("/:groupId/leave", leaveGroup); // User leaves a group

// --- ADMIN-ONLY ROUTES ---
router.post("/:groupId/members", requireGroupAdmin(), addMember);
router.delete("/:groupId/members", requireGroupAdmin(), removeMember);
router.delete("/:groupId", requireGroupAdmin(), deleteGroup);

export default router;
