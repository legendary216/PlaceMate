import Question from '../models/Questions.js';

/**
 * @desc    Add a new question
 * @route   POST /api/questions
 * @access  Private/Admin
 */
export const addQuestion = async (req, res) => {
  try {
    const { question, answer, category, difficulty } = req.body;

    // Simple validation
    if (!question || !answer || !category || !difficulty) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    const newQuestion = new Question({ question, answer, category, difficulty });
    await newQuestion.save();
    res.status(201).json({ message: 'Question added successfully', question: newQuestion });
  } catch (error) {
    console.error('Error adding question:', error);
    res.status(500).json({ message: 'Server error while adding question.' });
  }
};

/**
 * @desc    Get all questions for a specific category
 * @route   GET /api/questions/:category
 * @access  Public
 */
export const getQuestionsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const questions = await Question.find({ category: category });

    if (!questions) {
        return res.status(404).json({ message: 'No questions found for this category.' });
    }
    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Search for questions by keyword
 * @route   GET /api/questions/search?q=keyword
 * @access  Public
 */
export const searchQuestions = async (req, res) => {
  try {
    const searchTerm = req.query.q;

    if (!searchTerm) {
      return res.status(400).json({ message: 'Please provide a search term.' });
    }

    // Use a regular expression for a case-insensitive search within the 'question' field
    const searchResults = await Question.find({
      question: { $regex: searchTerm, $options: 'i' }
    });

    res.status(200).json(searchResults);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error during search.' });
  }
};


/**
 * @desc    Delete a question by its ID
 * @route   DELETE /api/questions/:id
 * @access  Private/Admin
 */
export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);

    if (question) {
      await Question.deleteOne({ _id: id });
      res.json({ message: 'Question removed' });
    } else {
      res.status(404).json({ message: 'Question not found' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

