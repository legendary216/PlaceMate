import Question from '../models/Questions.js';

// @desc    Get all questions by category
// @route   GET /api/questions/:category
// @access  Public
export const getQuestionsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    // Validate the category
    if (!['technical', 'hr', 'aptitude'].includes(category)) {
      return res.status(400).json({ message: 'Invalid question category.' });
    }

    const questions = await Question.find({ category });

    if (!questions || questions.length === 0) {
      return res.status(404).json({ message: `No questions found for the category: ${category}` });
    }

    res.status(200).json(questions);

  } catch (error) {
    console.error(`Error fetching questions for category ${req.params.category}:`, error);
    res.status(500).json({ message: 'Server error while fetching questions.' });
  }
};


// @desc    Add a new question (for admin purposes)
// @route   POST /api/questions
// @access  Private (should be protected in a real app)
export const addQuestion = async (req, res) => {
    try {
        const { question, answer, category } = req.body;

        if (!question || !answer || !category) {
            return res.status(400).json({ message: 'Please provide question, answer, and category.' });
        }

        const newQuestion = new Question({
            question,
            answer,
            category,
        });

        const savedQuestion = await newQuestion.save();

        res.status(201).json({ 
            message: 'Question added successfully.',
            data: savedQuestion 
        });

    } catch (error) {
        console.error('Error adding new question:', error);
        res.status(500).json({ message: 'Server error while adding question.' });
    }
};
