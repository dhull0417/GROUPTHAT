import { Router } from 'express';
import { requireAuth } from '@clerk/express';
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
router.post("/sync", syncNewUser); // rate limiting with arcjet

// --- PROTECTED ROUTES ---
router.use(requireAuth());

router.get("/me", getCurrentUser);
router.get("/me/groups", getUserGroups);
router.put("/profile", updateUserProfile);

export default router;