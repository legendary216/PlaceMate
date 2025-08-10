import express from "express";
import { registerMentor, loginMentor, logoutMentor } from "../Controller/authMentorController.js";

const router = express.Router();

// Register Mentor
router.post("/register", registerMentor);

// Login Mentor
router.post("/login", loginMentor);

// Logout Mentor
router.post("/logout", logoutMentor);

export default router;
 