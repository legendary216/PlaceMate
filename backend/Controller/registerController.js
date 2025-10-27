import Mentor from '../models/Mentors.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { uploadToCloudinary } from '../config/cloudinaryConfig.js'; // Assumes you created this helper

// --- Multer Configuration: Use memoryStorage for Cloudinary ---
const storage = multer.memoryStorage();

// Define the upload instance here, outside the exported function
const upload = multer({
    storage: storage, // Store file buffers in memory
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        // Validation logic for file types
        if (file.fieldname === 'profilePic') {
            if (file.mimetype.startsWith('image/')) { cb(null, true); }
            else { cb(new Error('Profile picture must be an image.'), false); }
        } else if (file.fieldname === 'idProof') {
            if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') { cb(null, true); }
            else { cb(new Error('ID proof must be an image or PDF.'), false); }
        } else { cb(null, false); } // Reject other fields
    }
}).fields([
    { name: 'profilePic', maxCount: 1 },
    { name: 'idProof', maxCount: 1 }
]);

// @desc    Register a new mentor
export const registerMentor = (req, res) => {
    // 1. Run Multer middleware first
    upload(req, res, async (err) => {
        // Handle Multer errors (file size limit, file type validation, "unexpected end of form")
        if (err instanceof multer.MulterError) { return res.status(400).json({ message: `File upload error: ${err.message}` }); }
        else if (err) { return res.status(400).json({ message: err.message || 'File validation error.' }); }

        try {
            // Destructure text fields from req.body
            const {
                fullName, email, phone, password,
                jobTitle, company, experience, qualification,
                expertise, availabilitySlots, // JSON string
                fees
            } = req.body;

            // Check if required files were received by multer (files are in req.files)
            if (!req.files || !req.files.idProof || req.files.idProof.length === 0) {
                // This is the error message the frontend received previously
                return res.status(400).json({ message: 'ID proof document is required.' });
            }

            // Get file objects (which contain the buffer)
            const profilePicFile = req.files.profilePic ? req.files.profilePic[0] : null;
            const idProofFile = req.files.idProof[0];

            // Check if mentor already exists
            let mentor = await Mentor.findOne({ email });
            if (mentor) { return res.status(400).json({ message: 'A user with this email already exists.' }); }

            // 2. Upload files to Cloudinary asynchronously
            let profilePicUrl = 'no-photo.jpg'; // Default URL if no file provided
            let idProofUrl = '';

            const uploadPromises = [];

            // Upload profile picture if provided (using buffer)
            if (profilePicFile) {
                console.log("Uploading profile picture to Cloudinary...");
                uploadPromises.push(
                    uploadToCloudinary(profilePicFile.buffer, {
                        folder: "placemate/profile_pics",
                    }).then(result => { profilePicUrl = result.secure_url; })
                );
            }

            // Upload ID proof (required, using buffer)
            console.log("Uploading ID proof to Cloudinary...");
            uploadPromises.push(
                uploadToCloudinary(idProofFile.buffer, {
                    folder: "placemate/id_proofs",
                    resource_type: "auto",
                }).then(result => { idProofUrl = result.secure_url; })
            );

            // Wait for all uploads to complete
            await Promise.all(uploadPromises);
            console.log("Cloudinary uploads finished.");


            // 3. Process other data
            const parsedSlots = availabilitySlots ? JSON.parse(availabilitySlots) : [];
            const numericFees = fees ? Number(fees) : 0;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // 4. Create mentor with Cloudinary URLs
            mentor = await Mentor.create({
                fullName, email, phone, password: hashedPassword,
                jobTitle, company, experience, qualification, expertise,
                profilePic: profilePicUrl, // Cloudinary URL
                idProof: idProofUrl,      // Cloudinary URL
                availabilitySlots: parsedSlots,
                fees: numericFees,
            });

            res.status(201).json({ message: 'Mentor registered successfully', mentor });

        } catch (error) {
            console.error('REGISTRATION ERROR:', error);
            // Handle specific errors (Mongoose Validation, Cloudinary upload failure)
            if (error.name === 'ValidationError') { const messages = Object.values(error.errors).map(val => val.message); return res.status(400).json({ message: messages.join('. ') }); }
            // Check if the error is from a rejected Promise during upload
            if (error.message && error.message.includes('Cloudinary')) {
                 return res.status(500).json({ message: error.message });
            }
            res.status(500).json({ message: error.message || 'An unexpected error occurred during registration.' });
        }
    });
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

   

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user', // default
    });

    res.status(201).json({
      message: 'User registered successfully. Please log in.',
      user: { id: user._id, email: user.email, role: user.role },
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' ,error});
  }
};
