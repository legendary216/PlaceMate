import Mentor from '../models/Mentors.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// @desc    Register a new mentor
export const registerMentor = async (req, res) => {
    try {
        const {
            fullName,
            email,
            phone,
            password,
            jobTitle,
            company,
            experience,
            qualification,
            expertise,
           availabilitySlots,
           fees
        } = req.body;

        // Check if required files were uploaded
        if (!req.files || !req.files.idProof) {
            return res.status(400).json({ message: 'Please upload an ID proof document.' });
        }

        // Check if user already exists 
        let mentor = await Mentor.findOne({ email });
        if (mentor) {
            // It's good practice to clean up uploaded files if validation fails
            // (This would require importing 'fs' and adding more logic)
            return res.status(400).json({ message: 'A user with this email already exists.' });
        }

        const parsedSlots = availabilitySlots ? JSON.parse(availabilitySlots) : [];
        const numericFees = fees ? Number(fees) : 0;
const baseUrl = `${req.protocol}://${req.get('host')}`;
        // Create new mentor instance
        mentor = new Mentor({
            fullName,
            email,
            phone,
            password,
            jobTitle,
            company,
            experience,
            qualification,
            expertise,
            idProof: `${baseUrl}/${req.files.idProof[0].path}`,
            profilePic: req.files.profilePic ? `${baseUrl}/${req.files.profilePic[0].path}` : undefined,
            availabilitySlots: parsedSlots,
            fees: numericFees
        });

        // Encrypt password
        const salt = await bcrypt.genSalt(10);
        mentor.password = await bcrypt.hash(password, salt);

        await mentor.save();

        res.status(201).json({
            success: true,
            message: 'Mentor registered successfully.',
            data: { id: mentor.id, name: mentor.fullName }
        });

    } catch (error) {
        // --- IMPROVED ERROR HANDLING ---
        // Log the detailed error on the server for debugging
        console.error('REGISTRATION ERROR:', error); 

        // Handle file size limit error from Multer
        if (error.code === 'LIMIT_FILE_SIZE') {
             return res.status(400).json({ message: 'File is too large. Maximum size is 5MB.' });
        }

        // Handle Mongoose validation errors (e.g., required field missing)
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        
        // For all other errors, send a generic but more informative message
        res.status(500).json({ message: 'An unexpected error occurred on the server. Please check the server logs.' });
    }
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
