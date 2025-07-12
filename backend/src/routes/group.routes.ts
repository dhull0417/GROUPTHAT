import { Router } from 'express';
import clerk = require('@clerk/express');
import { requireGroupAdmin } from '../middleware/auth.middleware';
import {
    createGroup,
    getGroupDetails,
    addMember,
    removeMember,
    dissolveGroup,
    leaveGroup
} from '../controllers/group.controller';

const router = Router();

// --- BASE PROTECTION ---
router.use(clerk.requireAuth());

// --- ROUTES FOR ANY LOGGED-IN USER ---
router.post("/", createGroup); // Create a new group
router.get("/:groupId", getGroupDetails);
router.delete("/:groupId/leave", leaveGroup); // User leaves a group

// --- ADMIN-ONLY ROUTES ---
router.post("/:groupId/members", requireGroupAdmin(), addMember);
router.delete("/:groupId/members", requireGroupAdmin(), removeMember);
router.delete("/:groupId", requireGroupAdmin(), dissolveGroup);

export default router;
