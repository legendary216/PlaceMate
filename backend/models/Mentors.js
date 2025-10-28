import mongoose from 'mongoose'; // Using import

const mentorSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Please add a full name'],
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    phone: {
        type: String,
        required: [true, 'Please add a phone number'],
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
    },
    jobTitle: { type: String },
    company: { type: String },
    experience: { type: String },
    qualification: { type: String },
    expertise: { type: String },
    
    // --- OLD FIELDS REMOVED ---
    // availability: { type: String },
    // hours: { type: String },

    // --- NEW FIELD ADDED ---
    availabilitySlots: [{
        day: {
            type: String,
            enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            required: true
        },
        startTime: { type: String, required: true }, // e.g., "14:00"
        endTime: { type: String, required: true }    // e.g., "16:00"
    }],

    fees: {
        type: Number,
        min: [0, 'Fees cannot be negative'], // Optional validation
        default: 0 // Default to 0 or leave undefined if required
    },

    averageRating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    numReviews: {
        type: Number,
        min: 0,
        default: 0
    },
    
    profilePic: {
        type: String,
        default: 'no-photo.jpg'
    },
    idProof: {
        type: String,
        required: [true, 'Please upload an ID proof document'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
}, {
    timestamps: true
});

export default mongoose.model('Mentor', mentorSchema); // Using export default