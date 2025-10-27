import express from 'express';
import { 
    addQuestion, 
    getQuestionsByCategory, 
    searchQuestions, 
    deleteQuestion
} from '../Controller/QuestionController.js';

// In a real application, you would import and apply your authentication middleware here
// to protect the admin-only routes.
// Example: import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// It is important to place the more specific '/search' route before the dynamic '/:category' route.
// This prevents Express from treating "search" as a category name.

/**
 * @desc    Search for questions by a keyword
 * @route   GET /api/questions/search?q=react
 * @access  Public
 */
router.get('/search', searchQuestions);

/**
 * @desc    Get all questions for a specific category
 * @route   GET /api/questions/technical
 * @access  Public
 */
router.get('/:category', getQuestionsByCategory);

/**
 * @desc    Add a new question
 * @route   POST /api/questions
 * @access  Private/Admin (should be protected)
 */
// To secure this route, you would uncomment and add the middleware like so:
// router.post('/', protect, admin, addQuestion);
router.post('/', addQuestion);

/**
 * @desc    Delete a specific question by its ID
 * @route   DELETE /api/questions/60d21b4667d0d8992e610c85
 * @access  Private/Admin (should be protected)
 */
// This route should also be protected for admins.
// router.delete('/:id', protect, admin, deleteQuestion);
router.delete('/:id', deleteQuestion);



export default router;

