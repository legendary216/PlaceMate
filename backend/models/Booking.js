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
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  // --- NEW STATUS FIELD ---
  status: {
    type: String,
    enum: [
      'pending_mentor_approval', // Initial state after student requests
      'confirmed',              // After mentor accepts and adds link
      'rejected_by_mentor',     // If mentor rejects the request
      'cancelled_by_student',   // If student cancels (optional)
      'cancelled_by_mentor',    // If mentor cancels after confirming (optional)
      'completed'               // After the session time passes (optional)
    ],
    default: 'pending_mentor_approval', // Default for new requests
  },
  // --- NEW MEETING LINK FIELD ---
  meetingLink: {
    type: String, // To store the Google Meet / Zoom link etc.
    trim: true,
  },

  hasBeenReviewed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Index to quickly find bookings for a mentor at a specific time
bookingSchema.index({ mentor: 1, startTime: 1 });

// Optional: Prevent duplicate PENDING requests for the same slot
bookingSchema.index({ mentor: 1, startTime: 1, status: 1 }, {
  unique: true,
  partialFilterExpression: { status: 'pending_mentor_approval' }
});


export default mongoose.model('Booking', bookingSchema);