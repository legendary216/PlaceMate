import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Mentor from '../models/Mentors.js';
import User from '../models/User.js';

// 1. This new 'protect' middleware just checks if the token is valid.
// It finds the user from ANY collection based on the role in the token.
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // Decode token to get ID and ROLE
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // This is the flexible part:
    let user;
    if (decoded.role === 'admin') {
      user = await Admin.findById(decoded.id).select('-password');
    } else if (decoded.role === 'mentor') {
      user = await Mentor.findById(decoded.id).select('-password');
    } else if (decoded.role === 'user') {
      user = await User.findById(decoded.id).select('-password');
    }

    if (!user) {
      return res.status(401).json({ message: 'User not found, token invalid' });
    }

    // Attach user (with their role) to the request
    req.user = user;
    req.user.role = decoded.role; // Ensure role is explicitly set
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token failed' });
  }
};

// 2. This new 'authorize' middleware checks permission
export const authorize = (...roles) => {
  return (req, res, next) => {
    // 'protect' must run first to attach req.user
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: User with role '${req.user.role}' cannot access this route. Allowed roles: ${roles.join(', ')}`
      });
    }
    next();
  };
};