// controllers/authController.js

// ... (imports: Mentor, bcrypt, multer, uploadToCloudinary) ...

// --- Multer Configuration with memoryStorage ---
const storage = multer.memoryStorage();
export const mentorUpload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => { /* ... your file filter logic ... */ }
}).fields([
    { name: 'profilePic', maxCount: 1 },
    { name: 'idProof', maxCount: 1 }
]);
// --- END Multer Configuration ---


// @desc    Register a new mentor
export const registerMentor = async (req, res) => { // NOTE: Function is async now
    // NOTE: Multer errors must be handled HERE now
    if (req.multerError) { 
        return res.status(400).json({ message: req.multerError });
    }
    
    // Now req.files and req.body are populated!
    
    try {
        const {
            fullName, email, phone, password,
            jobTitle, company, experience, qualification,
            expertise, availabilitySlots, // JSON string
            fees
        } = req.body;

        // Check file requirement (now access from req.files)
        if (!req.files || !req.files.idProof || req.files.idProof.length === 0) {
            return res.status(400).json({ message: 'ID proof document is required.' });
        }
        
        // ... (The rest of your Cloudinary and database logic remains largely the same) ...
        const profilePicFile = req.files.profilePic ? req.files.profilePic[0] : null;
        const idProofFile = req.files.idProof[0];

        // Check if mentor already exists
        let mentor = await Mentor.findOne({ email });
        if (mentor) { return res.status(400).json({ message: 'A user with this email already exists.' }); }

        // 2. Upload files to Cloudinary asynchronously
        let profilePicUrl = 'no-photo.jpg';
        let idProofUrl = '';
        const uploadPromises = [];
        
        // Upload logic...
        
        await Promise.all(uploadPromises); 

        // 3. Process data and create mentor
        const parsedSlots = availabilitySlots ? JSON.parse(availabilitySlots) : [];
        // ... hashing password, creating mentor ...
        
        res.status(201).json({ message: 'Mentor registered successfully', mentor });

    } catch (error) {
        console.error('REGISTRATION ERROR:', error);
        if (error.name === 'ValidationError') { /* ... */ }
        res.status(500).json({ message: error.message || 'An unexpected error occurred during registration.' });
    }
};