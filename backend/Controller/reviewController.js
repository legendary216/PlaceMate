import mongoose from 'mongoose'; // <-- Add this import
import Review from '../models/Review.js';
import Mentor from '../models/Mentors.js';

// @desc    Create a new review for a mentor
// @route   POST /api/reviews/:mentorId  <-- Fixed comment
// @access  Private (Student only)
export const createReview = async (req, res) => {
  const { rating, feedback } = req.body;
  const { mentorId } = req.params; // Get mentorId from params
  const studentId = req.user.id; // From 'protect' middleware

  // --- Input Validation ---
  if (!mongoose.Types.ObjectId.isValid(mentorId)) {
    return res.status(400).json({ message: 'Invalid Mentor ID format' });
  }
  // Ensure rating is a number and within range
  const numericRating = Number(rating);
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ message: 'Please provide a valid rating between 1 and 5' });
  }
  // --- End Input Validation ---

  try {
    // --- Create Review ---
    const review = await Review.create({
      mentor: mentorId,
      student: studentId,
      rating: numericRating, // Use the validated number
      feedback: feedback || '', // Ensure feedback is at least an empty string
    });

    // The static method on Review.js will automatically update the mentor's average

    res.status(201).json({ success: true, data: review });

  } catch (err) {
    console.error("Error creating review:", err);
    // --- Handle duplicate key error ---
    // if (err.code === 11000) { // Error code for unique index violation
    //   return res.status(400).json({ message: 'You have already submitted a review for this mentor.' });
    // }
    // --- Handle Mongoose validation errors (if any remain in the model) ---
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server Error while creating review' });
  }
};


// @desc    Get all reviews for a specific mentor
// @route   GET /api/reviews/:mentorId
// @access  Public
export const getMentorReviews = async (req, res) => {
    try {
        // --- Added check for valid mentorId format ---
        if (!mongoose.Types.ObjectId.isValid(req.params.mentorId)) {
             return res.status(400).json({ message: 'Invalid Mentor ID format' });
        }

        const reviews = await Review.find({ mentor: req.params.mentorId })
            .populate('student', 'fullName profilePic') // Get student's name and pic
            .sort({ createdAt: -1 }); // Show newest reviews first

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (err) {
        console.error("Error fetching reviews:", err);
        res.status(500).json({ message: 'Server Error while fetching reviews' });
    }
};

// @desc    Check if current user has reviewed a specific mentor
// @route   GET /api/reviews/my-review/:mentorId
// @access  Private (Student only)
export const checkMyReview = async (req, res) => {
  try {
    // --- Added check for valid mentorId format ---
    if (!mongoose.Types.ObjectId.isValid(req.params.mentorId)) {
         return res.status(400).json({ message: 'Invalid Mentor ID format' });
    }

    const review = await Review.findOne({
      mentor: req.params.mentorId,
      student: req.user.id
    });

    if (review) {
      res.status(200).json({ hasReviewed: true, review: review });
    } else {
      res.status(200).json({ hasReviewed: false });
    }
  } catch (err) {
    console.error("Error checking user review:", err);
    res.status(500).json({ message: 'Server Error while checking review status' });
  }
};