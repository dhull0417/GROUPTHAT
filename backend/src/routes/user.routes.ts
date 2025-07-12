import { Router } from 'express';
import clerk = require('@clerk/express');
import {
    getCurrentUser,
    getUserProfile,
    getUserGroups,
    updateUserProfile,
    syncNewUser
} from '../controllers/user.controller';

const router = Router();

// --- PUBLIC ROUTES ---
router.get("/profile/:userId", getUserProfile);
router.post("/sync", syncNewUser);

// --- PROTECTED ROUTES ---
router.use(clerk.requireAuth());

router.get("/me", getCurrentUser);
router.get("/me/groups", getUserGroups);
router.put("/profile", updateUserProfile);

export default router;