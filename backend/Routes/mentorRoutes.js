import express from 'express';
const router = express.Router();

// Import the new controller function
import { 
  getApprovedMentors,
  getMentorProfile  // <-- Import the new function
} from '../Controller/mentorController.js'; // Adjust path
// --- Routes ---
// This route is public and has NO 'protect' middleware
router.get('/approved', getApprovedMentors);
router.get('/:id', getMentorProfile);

export default router; 