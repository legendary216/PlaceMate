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
  booking: {
    type: mongoose.Schema.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true, // A student can only review a booking once
  },
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

// Static method to calculate the average rating for a mentor
reviewSchema.statics.calculateAverageRating = async function(mentorId) {
  const stats = await this.aggregate([
    { $match: { mentor: mentorId } },
    {
      $group: {
        _id: '$mentor',
        numReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' }
      }
    }
  ]);

  try {
    if (stats.length > 0) {
      await mongoose.model('Mentor').findByIdAndUpdate(mentorId, {
        averageRating: stats[0].averageRating.toFixed(1), // Round to 1 decimal
        numReviews: stats[0].numReviews
      });
    } else {
      // No reviews found, reset to default
      await mongoose.model('Mentor').findByIdAndUpdate(mentorId, {
        averageRating: 0,
        numReviews: 0
      });
    }
  } catch (err) {
    console.error(err);
  }
};

// Call calculateAverageRating after a review is saved
reviewSchema.post('save', function() {
  this.constructor.calculateAverageRating(this.mentor);
});

// Call calculateAverageRating after a review is removed
reviewSchema.post('remove', function() {
  this.constructor.calculateAverageRating(this.mentor);
});

export default mongoose.model('Review', reviewSchema);