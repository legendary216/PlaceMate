import User from '../models/User.js';
import Mentor from '../models/Mentors.js';
import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// This is a new, unified login handler for all roles.
export const loginHandler = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // 1. Basic validation
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role are required.' });
    }

    let account;
    let accountData;

    // 2. Find the account based on the provided role
    if (role === 'user') {
      account = await User.findOne({ email });
    } else if (role === 'mentor') {
      account = await Mentor.findOne({ email });
    } else if (role === 'admin') {
      account = await Admin.findOne({ email });
    } else {
      return res.status(400).json({ message: 'Invalid role specified.' });
    }

    if (!account) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 3. Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    
    // 4. Create a payload for the JWT, including the role
    const payload = {
      id: account._id,
      role: role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    
    // Prepare user data to send back (excluding the password)
    accountData = { id: account._id, name: account.name, email: account.email };


    // 5. Send back a success response with the token and user info
    // This matches what your Login.js component expects.
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: accountData
    });

  } catch (error) {
    console.error('Server error during login:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const logoutUser = async (req, res) => {
  // This function can remain the same if you decide to use cookies later.
 try {
res
 .clearCookie('token')
.status(200)
 .json({ message: 'Logged out successfully' });
 } catch (error) {
 res.status(500).json({ message: 'Server error' });
 }
};

