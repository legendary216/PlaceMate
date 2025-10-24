import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
  // The student (User) who sent the request
  student: {
    type: mongoose.Schema.ObjectId,
    ref: 'User', // Must match your User model name
    required: true,
  },
  // The mentor who received the request
  mentor: {
    type: mongoose.Schema.ObjectId,
    ref: 'Mentor', // Must match your Mentor model name
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  }
}, {
  timestamps: true
});

// Prevent a student from sending duplicate requests to the same mentor
connectionSchema.index({ student: 1, mentor: 1 }, { unique: true });

export default mongoose.model('Connection', connectionSchema);