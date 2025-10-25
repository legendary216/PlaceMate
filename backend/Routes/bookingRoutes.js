import express from 'express';
const router = express.Router();
import {
  getAvailableSlots,
  createBooking,
  getMySchedule,
  getMyStudentSchedule,
  getPendingBookingRequests, // <-- Import
  confirmBookingRequest,    // <-- Import
  rejectBookingRequest,
  cancelBookingByStudent, // <-- Import
  cancelBookingByMentor
} from '../Controller/bookingController.js';

// Import auth middleware
import { protect, authorize } from '../Middleware/authMiddleware.js';

// --- Routes ---

// Get available slots for a mentor (Student needs to be logged in)
router.get('/available/:mentorId', protect, authorize('user'), getAvailableSlots);

// Create a new booking (Student needs to be logged in)
router.post('/', protect, authorize('user'), createBooking);

router.get('/my-schedule', protect, authorize('mentor'), getMySchedule);

router.get('/my-schedule-student', protect, authorize('user'), getMyStudentSchedule);

router.get('/my-pending-requests', protect, authorize('mentor'), getPendingBookingRequests); // <-- New: Get pending booking requests
router.patch('/confirm/:bookingId', protect, authorize('mentor'), confirmBookingRequest);   // <-- New: Confirm a request
router.patch('/reject/:bookingId', protect, authorize('mentor'), rejectBookingRequest);

// Student cancels a booking
router.patch('/cancel/student/:bookingId', protect, authorize('user'), cancelBookingByStudent);

// Mentor cancels a booking
router.patch('/cancel/mentor/:bookingId', protect, authorize('mentor'), cancelBookingByMentor);

export default router;