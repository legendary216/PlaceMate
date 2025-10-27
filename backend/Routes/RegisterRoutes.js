const express = require('express');
const router = express.Router();
const { registerUser,registerMentor } = require('../Controller/registerController');
const upload = require('../Middleware/uploadmiddleware');



// @route   POST /api/auth/users/register
// @desc    Register a new mentor with file uploads
// @access  Public
router.post('/registerMentor',  registerMentor);
router.post('/registerUser', registerUser);

module.exports = router;
