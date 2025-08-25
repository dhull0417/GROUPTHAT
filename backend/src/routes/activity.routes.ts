import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import { requireGroupAdmin } from '../middleware/auth.middleware.js';
import {
    getActivity,
    updateActivity,
    deleteActivity
} from '../controllers/activity.controller.js';

const router = Router();

// All activity routes require a logged-in user
router.use(requireAuth());


// Retrieves the details for a specific activity. The authenticated user must be
// a member of the group associated with the activity.
router.get("/:activityId", getActivity);


// Updates an activity. The authenticated user must be an admin of the group
// associated with the activity.
router.put("/:activityId", requireGroupAdmin(), updateActivity);

/**
 * DELETE /api/activity/:activityId
 * Deletes an activity. The authenticated user must be an admin of the group
 * associated with the activity.
 */
router.delete("/:activityId", requireGroupAdmin(), deleteActivity);

export default router;