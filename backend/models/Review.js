import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.ObjectId,
    ref: 'Mentor',
    required: true,
  },
  student: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  // --- REMOVED BOOKING FIELD ---
  // booking: {
  //   type: mongoose.Schema.ObjectId,
  //   ref: 'Booking',
  //   required: true,
  //   unique: true, 
  // },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, 'Please provide a rating between 1 and 5'],
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: [500, 'Feedback cannot be more than 500 characters'],
  }
}, {
  timestamps: true
});

// --- NEW: Enforce one review per student/mentor ---
reviewSchema.index({ student: 1, mentor: 1 }, { unique: true });

// --- (This static method calculateAverageRating remains the same) ---
reviewSchema.statics.calculateAverageRating = async function(mentorId) {
  // ... (no changes needed in this function)
};
reviewSchema.post('save', function() {
  this.constructor.calculateAverageRating(this.mentor);
});
reviewSchema.post('remove', function() {
  this.constructor.calculateAverageRating(this.mentor);
});

export default mongoose.model('Review', reviewSchema);