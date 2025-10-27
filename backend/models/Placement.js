import mongoose from 'mongoose';

const placementSchema = new mongoose.Schema({
  // --- CHANGED ---
  // Removed studentName
  // Added studentId linking to User model
  studentId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User', // Assuming your student User model is named 'User'
      required: [true, 'Please link the student ID'],
  },
  // --- END CHANGE ---
  company: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company',
    required: true,
  },
  year: {
    type: String,
    required: [true, 'Please specify the academic year (e.g., 2024-2025)'],
    trim: true,
  },
  packageLPA: {
    type: Number,
    min: 0
  },
   createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'Admin',
      required: true
  }
}, {
  timestamps: true
});

placementSchema.index({ year: 1, company: 1 });

export default mongoose.model('Placement', placementSchema);