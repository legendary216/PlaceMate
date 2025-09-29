const multer = require('multer');
const path = require('path');

// Configure storage engine
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function(req, file, cb) {
        // Create a unique filename to prevent overwrites
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// File filter to validate uploads
const fileFilter = (req, file, cb) => {
    // Allowed extensions
    const filetypes = /jpeg|jpg|png|pdf/;
    // Check extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime type
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Images (jpeg, jpg, png) and PDFs only!'));
    }
};

// Initialize upload variable with configuration
const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // Limit file size to 5MB
    fileFilter: fileFilter
}).fields([
    { name: 'profilePic', maxCount: 1 },
    { name: 'idProof', maxCount: 1 }
]);

module.exports = upload;
