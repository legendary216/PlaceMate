import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  mentor: {
    type: mongoose.Schema.ObjectId,
    ref: 'Mentor',
    required: true,
  },
  // Store the specific date and time for the session
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  // Optional: Add status for cancellations later
  status: {
    type: String,
    enum: ['confirmed', 'cancelled_student', 'cancelled_mentor'],
    default: 'confirmed',
  }
}, {
  timestamps: true
});

// Index to quickly find bookings for a mentor at a specific time
bookingSchema.index({ mentor: 1, startTime: 1 });

export default mongoose.model('Booking', bookingSchema);