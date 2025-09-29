import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Please provide the question text.'],
    trim: true,
  },
  answer: {
    type: String,
    required: [true, 'Please provide an answer.'],
  },
  category: {
    type: String,
    required: [true, 'Please specify a category.'],
    enum: ['technical', 'hr', 'aptitude'], // Ensures the category is one of these three values
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

const Question = mongoose.model('Question', questionSchema);

export default Question;
