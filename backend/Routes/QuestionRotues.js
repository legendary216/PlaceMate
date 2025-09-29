import express from 'express';
import { getQuestionsByCategory, addQuestion } from '../Controller/QuestionController.js';

const router = express.Router();

// Route to get questions based on their category
router.get('/:category', getQuestionsByCategory);

// Route to add a new question
router.post('/', addQuestion);


export default router;
 