import express from 'express';
const router = express.Router();
import {
  getApprovedMentors,
  getMentorProfile,
  getMyAvailability,
  updateMyAvailability
} from '../Controller/mentorController.js';

import { protect , authorize } from '../Middleware/authMiddleware.js';

// --- Public STATIC Routes First ---
router.get('/approved', getApprovedMentors);

// --- Private STATIC Routes Next ---
// These MUST come before the dynamic '/:id' route
router.get('/my-availability', protect, authorize('mentor'), getMyAvailability);
router.patch('/my-availability', protect, authorize('mentor'), updateMyAvailability);

// --- Public DYNAMIC Route Last ---
// This will now only catch valid IDs
router.get('/:id', getMentorProfile); 

export default router;