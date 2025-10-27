import express from 'express';
const router = express.Router();
import { analyzeResume } from '../Controller/resumeController.js';

// Import auth middleware (assuming users need to be logged in)
import { protect, authorize } from '../Middleware/authMiddleware.js';

// --- Routes ---
// POST /api/resume/analyze
// Protect route - assuming only logged-in users ('user' role) can analyze
router.post('/analyze', protect, authorize('user','admin'), analyzeResume);

export default router;