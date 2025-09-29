import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },
  answer: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['technical', 'hr', 'aptitude'],
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium',
  },
}, { timestamps: true });

const Question = mongoose.model('Question', questionSchema);

export default Question;

