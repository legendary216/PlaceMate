import express from 'express';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import LoginRoutes from './Routes/LoginRoutes.js';
import RegisterRoutes from './Routes/RegisterRoutes.js'
import authAdminRoutes from './Routes/authAdminRoutes.js'
import questionRoutes from './Routes/QuestionRotues.js';
import adminMentorRoutes from './Routes/adminMentorRoutes.js';
import mentorRoutes from './Routes/mentorRoutes.js';
import connectionRoutes from './Routes/connectionRoutes.js';
import bookingRoutes from './Routes/bookingRoutes.js';
import companyRoutes from './Routes/companyRoutes.js';
import resumeRoutes from './Routes/resumeRotues.js';

import './config/cloudinaryConfig.js';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import cors from "cors";


dotenv.config(); 
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();
app.use(cors({
  origin: ["http://localhost:8081", "http://192.168.0.147:8081"],
  credentials: true,
}));


app.use(express.json());
app.use(cookieParser())
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB Atlas
connectDB();
app.use('/api/auth/login',LoginRoutes)
app.use('/api/auth/register',RegisterRoutes)
app.use('/api/auth/admin',authAdminRoutes)
app.use('/api/questions', questionRoutes);
app.use('/api/admin', adminMentorRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api', companyRoutes);
app.use('/api/resume', resumeRoutes);

// Make the 'uploads' folder publicly accessible
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
 

// API Routes
 

app.get('/', (req, res) => {
  res.send('MongoDB connection check successful!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
