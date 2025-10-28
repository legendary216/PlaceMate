import express from 'express';
const router = express.Router();
import {
  createReview,
  getMentorReviews,
  checkMyReview
} from '../Controller/reviewController.js';

// Import auth middleware
import { protect, authorize } from '../Middleware/authMiddleware.js';

// --- Routes ---

router.get('/my-review/:mentorId', protect, authorize('user'), checkMyReview);

// Get all reviews for one mentor (Public)
// e.g., GET /api/reviews/60d...
router.get('/:mentorId', getMentorReviews);

// Create a new review for a specific booking (Student only)
// e.g., POST /api/reviews/60e...
router.post('/:bookingId', protect, authorize('user'), createReview);

export default router;