// src/routes/event.routes.ts

import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import {
    getUpcomingEventForGroup,
    updateMyAttendance
} from '../controllers/event.controller';

const router = Router();

// --- BASE PROTECTION ---
// All event-related routes require an authenticated user.
router.use(requireAuth());

/**
 * GET /api/events/group/:groupId/upcoming
 * Retrieves the single upcoming event for a specific group.
 * The user must be a member of the group to access this.
 */
router.get("/group/:groupId/upcoming", getUpcomingEventForGroup);

/**
 * PUT /api/events/:eventId/status
 * Allows the authenticated user to update their own attendance status
 * for a specific event.
 * Body: { status: "in" | "out" | "undecided" }
 */
router.put("/:eventId/status", updateMyAttendance);

export default router;