import express from 'express';
const router = express.Router();

import { 
  getPendingMentors, 
  approveMentor, 
  rejectMentor 
} from '../Controller/adminMentorController.js';

// Import your corrected protect middleware
import { protect } from '../Middleware/authMiddleware.js'; // Adjust path as needed

// --- Apply Middleware ---
// This one line protects ALL routes in this file.
// It will check for the token AND ensure the user is in the admin collection.
router.use(protect);

// --- Routes ---
// Only an admin who passed the 'protect' middleware can access these.
router.get('/mentors/pending', getPendingMentors);
router.patch('/mentors/approve/:id', approveMentor);
router.patch('/mentors/reject/:id', rejectMentor);

export default router;