import jwt from 'jsonwebtoken';
import admin from '../models/Admin.js'; // This correctly imports your Admin model

export const protect = async (req, res, next) => {
  let token;

  // 1. Look for the token in the 'Authorization' header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // 2. Extract the token from 'Bearer <token>'
    token = req.headers.authorization.split(' ')[1];
  }
  // (Your original code was looking at 'req.cookies.token' which was the mismatch)

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // 3. Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Find the user in your 'admin' collection
    // This is perfect. If a user is found here, they *are* an admin.
    req.user = await admin.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User not found, token invalid' });
    }

    next(); // All good, proceed to the route
  } catch (error) {
    res.status(401).json({ message: 'Token failed' });
  }
};