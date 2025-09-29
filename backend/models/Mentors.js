const mongoose = require('mongoose');

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
        minlength: 6,
        select: false, // Don't return password by default
    },
    jobTitle: { type: String },
    company: { type: String },
    experience: { type: String },
    qualification: { type: String },
    expertise: { type: String },
    availability: { type: String },
    hours: { type: String },
    profilePic: {
        type: String,
        default: 'no-photo.jpg'
    },
    idProof: {
        type: String,
        required: [true, 'Please upload an ID proof document'],
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Mentor', mentorSchema);
