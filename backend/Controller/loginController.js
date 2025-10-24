import User from '../models/User.js';
import Mentor from '../models/Mentors.js';
import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// This is a new, unified login handler for all roles.
export const loginHandler = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role are required.' });
    }

    let Model;
    if (role === 'user') Model = User;
    else if (role === 'mentor') Model = Mentor;
    else if (role === 'admin') Model = Admin;
    else return res.status(400).json({ message: 'Invalid role specified.' });

    // 1. Find the account. (Password is now included by default)
    const account = await Model.findOne({ email });

    if (!account) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 2. Compare password (This works now)
    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    
    // 3. Create token
    const payload = { id: account._id, role: role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    
    // 4. --- THIS IS THE FIX ---
    // Convert the Mongoose document to a plain object
    const userToReturn = account.toObject();

    // Explicitly delete the password before sending it
    delete userToReturn.password;

    // 5. Send back the token and the *clean* user object.
    // This object contains all fields (like 'status') EXCEPT the password.
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userToReturn 
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

