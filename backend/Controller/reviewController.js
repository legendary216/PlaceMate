import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import Mentor from '../models/Mentors.js';

// @desc    Create a new review for a booking
// @route   POST /api/reviews/:bookingId
// @access  Private (Student only)
export const createReview = async (req, res) => {
  const { rating, feedback } = req.body;
  const { bookingId } = req.params;
  const studentId = req.user.id; // From 'protect' middleware

  try {
    const booking = await Booking.findById(bookingId);

    // --- Validation Checks ---
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check 1: Is this the correct student?
    if (booking.student.toString() !== studentId) {
      return res.status(401).json({ message: 'Not authorized to review this booking' });
    }

    // Check 2: Has the session been confirmed? (And optionally, is it in the past?)
    // We'll allow reviews for any 'confirmed' booking.
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'Cannot review a session that was not confirmed' });
    }
    
    // Check 3: Has this booking already been reviewed?
    if (booking.hasBeenReviewed) {
        return res.status(400).json({ message: 'This booking has already been reviewed' });
    }

    // --- Create Review ---
    const review = await Review.create({
      mentor: booking.mentor,
      student: studentId,
      booking: bookingId,
      rating: Number(rating),
      feedback,
    });

    // --- Mark Booking as Reviewed ---
    booking.hasBeenReviewed = true;
    await booking.save();
    
    // The static method on Review.js will automatically update the mentor's average

    res.status(201).json({ success: true, data: review });

  } catch (err) {
    console.error(err);
    if (err.code === 11000) { // Handle unique constraint error for booking
        return res.status(400).json({ message: 'This booking has already been reviewed.' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};


// @desc    Get all reviews for a specific mentor
// @route   GET /api/reviews/:mentorId
// @access  Public
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