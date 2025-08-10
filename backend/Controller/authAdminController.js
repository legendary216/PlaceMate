import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';



export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await Admin.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await Admin.create({
      name,
      email,
      password: hashedPassword,

    });

    res.status(201).json({
      message: 'Admin registered successfully. Please log in.',
      user: { id: user._id, email: user.email, role: user.role },
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' ,error});
  }
};

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: 'Admin not found' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // true in production with HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ message: 'Admin logged in successfully'});

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }


  
};

export const logoutAdmin = async (req, res) => {
  try {
    res
      .clearCookie('token', {
        httpOnly: true,
        secure: false, // true in production
        sameSite: 'strict',
      })
      .status(200)
      .json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
