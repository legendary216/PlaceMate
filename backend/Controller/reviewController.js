import Review from '../models/Review.js';

import Mentor from '../models/Mentors.js';

// @desc    Create a new review for a booking
// @route   POST /api/reviews/:bookingId
// @access  Private (Student only)
export const createReview = async (req, res) => {
  const { rating, feedback } = req.body;
  const { mentorId } = req.params;
  const studentId = req.user.id; // From 'protect' middleware

  try {
    // --- Create Review ---
    const review = await Review.create({
      mentor: mentorId,
      student: studentId,
      rating: Number(rating),
      feedback,
    });
    
    // The static method on Review.js will automatically update the mentor's average
    res.status(201).json({ success: true, data: review });

  } catch (err) {
    console.error(err);
    // --- NEW: Handle duplicate key error ---
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You have already submitted a review for this mentor.' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getMentorReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ mentor: req.params.mentorId })
            .populate('student', 'fullName profilePic') // Get student's name and pic
            .sort({ createdAt: -1 }); // Show newest reviews first

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const checkMyReview = async (req, res) => {
  try {
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
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};