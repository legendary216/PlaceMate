import express from 'express';
const router = express.Router();
import {
  getAvailableSlots,
  createBooking,
  getMySchedule
} from '../Controller/bookingController.js';

// Import auth middleware
import { protect, authorize } from '../Middleware/authMiddleware.js';

// --- Routes ---

// Get available slots for a mentor (Student needs to be logged in)
router.get('/available/:mentorId', protect, authorize('user'), getAvailableSlots);

// Create a new booking (Student needs to be logged in)
router.post('/', protect, authorize('user'), createBooking);

router.get('/my-schedule', protect, authorize('mentor'), getMySchedule);

export default router;