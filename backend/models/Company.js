import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a company name'],
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  website: {
    type: String,
    trim: true,
    match: [/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i, 'Please use a valid URL with HTTP/HTTPS']
  },
  logoUrl: {
    type: String,
    trim: true,
  },
  // --- NEW FIELDS ---
  rolesOffered: [{ // Array of strings for roles
    type: String,
    trim: true,
  }],
  location: { // Primary location or HQ
    type: String,
    trim: true,
  },
  // --- END NEW FIELDS ---
  createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'Admin',
      required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Company', companySchema);