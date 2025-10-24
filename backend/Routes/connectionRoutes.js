import express from 'express';
const router = express.Router();
import {
  createConnectionRequest,
  getMentorRequests,
  respondToRequest,
  checkConnectionStatus
} from '../Controller/connectionController.js';

// Import your auth middleware
import { protect, authorize } from '../Middleware/authMiddleware.js'; 

// --- Student Route ---
// Only a logged-in 'user' can create a request
router.post('/request', protect, authorize('user'), createConnectionRequest);
router.get('/status/:mentorId', protect, authorize('user'), checkConnectionStatus);

// --- Mentor Routes ---
// Only a logged-in 'mentor' can see their requests
router.get('/my-requests', protect, authorize('mentor'), getMentorRequests);

// Only a logged-in 'mentor' can respond to a request
router.patch('/respond/:id', protect, authorize('mentor'), respondToRequest);


export default router;