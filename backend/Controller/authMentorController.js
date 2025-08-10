import Mentor from "../models/Mentors.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Register Mentor

const generateToken = (MentorId) => {
  return jwt.sign({ MentorId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};


export const registerMentor = async (req, res) => {
  try {
    const { name, email, password, company, expertise ,experience} = req.body;

    // Check if mentor already exists
    const mentorExists = await Mentor.findOne({ email });
    if (mentorExists) {
      return res.status(400).json({ message: "Mentor already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create mentor (default approved = false)
    const mentor = await Mentor.create({
      name,
      email,
      password: hashedPassword,
      company,
      expertise,
      experience
    });

    res.status(201).json({
      message: "Mentor registered successfully. Awaiting admin approval.",
      mentor: { id: mentor._id, email: mentor.email, role: mentor.role },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Login Mentor
export const loginMentor = async (req, res) => {
  try {
    const { email, password } = req.body;

    const mentor = await Mentor.findOne({ email });
    if (!mentor) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check approval status
    if (!mentor.approved) {
      return res.status(403).json({ message: "Mentor not approved by admin" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, mentor.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create token
    // const token = jwt.sign(
    //   { id: mentor._id, role: mentor.role },
    //   process.env.JWT_SECRET,
    //   { expiresIn: "7d" }
    // );

    const token = generateToken(mentor._id);

    res.cookie("token", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({
      message: "Mentor logged in successfully",
      mentor: { id: mentor._id, email: mentor.email, role: mentor.role },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Logout Mentor
export const logoutMentor = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Mentor logged out successfully" });
};
